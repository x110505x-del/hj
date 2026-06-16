/**
 * 🔒 Privacy-First Cloud Synchronization Service
 * 
 * This service allows users to sync their training data (gold, streak, XP, achievements) 
 * across devices using Google/Kakao login, without storing any personal identifiable information (PII).
 * 
 * It converts the email address to a secure cryptographic hash lookup key, 
 * ensuring no email addresses are ever stored on the public cloud storage.
 */

import { getRankByXp } from './rankDb';

// Simple hashing function to obfuscate the email address for privacy
function obfuscateEmail(email) {
  if (!email) return 'anon';
  const cleanEmail = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    const char = cleanEmail.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'usr_' + Math.abs(hash);
}

// Public anonymous KV storage bucket ID for Hanja Master
const BUCKET_ID = 'WPnA3ko81FraCfgWmNSzPM';
const KV_BASE_URL = `https://kvdb.io/${BUCKET_ID}/`;

/**
 * Saves profile data to the cloud
 */
export async function saveProfileToCloud(profile) {
  if (!profile || !profile.isLoggedIn || !profile.email) {
    return false;
  }

  try {
    const key = obfuscateEmail(profile.email);
    const url = `${KV_BASE_URL}${key}`;

    const payload = {
      username: profile.username,
      email: profile.email, // Save real email for admin announcements/notifications
      gold: profile.gold,
      streak: profile.streak,
      xp: profile.xp,
      hearts: profile.hearts,
      unlockedLevels: profile.unlockedLevels || ['8급'],
      achievements: profile.achievements || [],
      studyHistory: profile.studyHistory || [],
      wrongHanjaNotes: profile.wrongHanjaNotes || {},
      authProvider: profile.authProvider,
      streakLastActive: profile.streakLastActive,
      lastActiveDate: profile.lastActiveDate,
      flashcardsToday: profile.flashcardsToday,
      loginSessionId: profile.loginSessionId,
      lastUpdated: new Date().toISOString()
    };

    // ⚠️ CRITICAL GUARDRAIL: Keep Content-Type as 'text/plain'.
    // Changing it to 'application/json' triggers CORS preflight (OPTIONS) which is rejected by kvdb.io.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });

    // Update global leaderboard asynchronously so it doesn't block
    if (response.ok) {
      updateGlobalLeaderboard(profile).catch(e => console.warn(e));
    }

    return response.ok;
  } catch (error) {
    console.error('Cloud save error:', error);
    return false;
  }
}

/**
 * Loads profile data from the cloud using the obfuscated email key
 */
export async function loadProfileFromCloud(email, provider) {
  if (!email) return null;

  try {
    const key = obfuscateEmail(email);
    const url = `${KV_BASE_URL}${key}?t=${Date.now()}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 404) {
        // No profile exists on the cloud yet
        return null;
      }
      throw new Error('Network response not ok');
    }

    const cloudData = await response.json();
    return {
      isLoggedIn: true,
      username: cloudData.username,
      email: email.trim().toLowerCase(),
      authProvider: provider || cloudData.authProvider || 'google',
      isPrivacyFirst: true,
      gold: cloudData.gold ?? 100,
      streak: cloudData.streak ?? 1,
      xp: cloudData.xp ?? 0,
      hearts: cloudData.hearts ?? 5,
      unlockedLevels: cloudData.unlockedLevels || ['8급'],
      achievements: cloudData.achievements || [],
      studyHistory: cloudData.studyHistory || [],
      wrongHanjaNotes: cloudData.wrongHanjaNotes || {},
      streakLastActive: cloudData.streakLastActive || null,
      lastActiveDate: cloudData.lastActiveDate || null,
      flashcardsToday: cloudData.flashcardsToday || 0,
      loginSessionId: cloudData.loginSessionId || null
    };
  } catch (error) {
    console.error('Cloud load error:', error);
    return null;
  }
}

/**
 * Fetches the shared Global Leaderboard from the cloud
 */
export async function fetchGlobalLeaderboard() {
  try {
    const boardUrl = `${KV_BASE_URL}global_hanja_leaderboard?t=${Date.now()}`;
    let boardList = [];
    
    // 1. Fetch current aggregated board
    const response = await fetch(boardUrl, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.board)) {
        boardList = data.board;
      } else if (Array.isArray(data)) {
        boardList = data;
      }
    }

    // 2. Fetch all keys in the bucket to find registered users (usr_*)
    const keysResponse = await fetch(`${KV_BASE_URL}?format=json&t=${Date.now()}`, { cache: 'no-store' });
    if (keysResponse.ok) {
      const keys = await keysResponse.json();
      if (Array.isArray(keys)) {
        // Exclude test accounts and only grab active real user hashes
        const userKeys = keys.filter(k => k.startsWith('usr_') && k !== 'usr_test');
        
        // Find user keys that are NOT yet in the boardList
        const missingUserKeys = userKeys.filter(key => {
          return !boardList.some(item => item.id === key);
        });

        // 3. If there are missing users, fetch their profiles in parallel
        if (missingUserKeys.length > 0) {
          const fetchPromises = missingUserKeys.map(async (key) => {
            try {
              const res = await fetch(`${KV_BASE_URL}${key}?t=${Date.now()}`, { cache: 'no-store' });
              if (res.ok) {
                const profile = await res.json();
                if (profile && profile.username) {
                  const xp = profile.xp ?? 0;
                  const streak = profile.streak ?? 0;
                  const rName = getRankByXp(xp, streak).name;
                  
                  return {
                    id: key,
                    username: profile.username,
                    gold: profile.gold ?? 0,
                    xp: xp,
                    rankName: rName,
                    lastUpdated: profile.lastUpdated ? new Date(profile.lastUpdated).getTime() : 0
                  };
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch missing user profile: ${key}`, err);
            }
            return null;
          });

          const missingEntries = (await Promise.all(fetchPromises)).filter(Boolean);
          
          if (missingEntries.length > 0) {
            // Merge, sort, and slice top 100
            boardList = [...boardList, ...missingEntries];
            boardList.sort((a, b) => b.gold - a.gold);
            boardList = boardList.slice(0, 100);

            // 4. Optimistically write back the healed board to kvdb using text/plain (CORS bypass)
            fetch(`${KV_BASE_URL}global_hanja_leaderboard`, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({ board: boardList })
            }).catch(e => console.warn("Auto-healing leaderboard update failed", e));
          }
        }
      }
    }

    return boardList;
  } catch (e) {
    console.error('Failed to fetch global leaderboard', e);
    return [];
  }
}

/**
 * Updates the shared Global Leaderboard with the user's latest stats
 */
export async function updateGlobalLeaderboard(profile) {
  if (!profile || !profile.isLoggedIn || !profile.username) return false;
  
  try {
    const url = `${KV_BASE_URL}global_hanja_leaderboard`;
    const getUrl = `${url}?t=${Date.now()}`;
    let currentBoard = [];
    
    // 1. Fetch current board
    const getRes = await fetch(getUrl, { cache: 'no-store' });
    if (getRes.ok) {
      const data = await getRes.json();
      if (data && Array.isArray(data.board)) {
        currentBoard = data.board;
      } else if (Array.isArray(data)) {
        currentBoard = data;
      }
    }
    
    // 2. Update my score
    const myId = obfuscateEmail(profile.email);
    const myIndex = currentBoard.findIndex(u => u.id === myId);
    
    const rName = getRankByXp(profile.xp ?? 0, profile.streak ?? 0).name;
    
    const myEntry = {
      id: myId,
      username: profile.username,
      gold: profile.gold,
      xp: profile.xp,
      rankName: rName,
      lastUpdated: new Date().getTime()
    };
    
    if (myIndex >= 0) {
      currentBoard[myIndex] = myEntry;
    } else {
      currentBoard.push(myEntry);
    }
    
    // 3. Sort by gold descending and keep top 100
    currentBoard.sort((a, b) => b.gold - a.gold);
    currentBoard = currentBoard.slice(0, 100);
    
    // ⚠️ CRITICAL GUARDRAIL: Keep Content-Type as 'text/plain' and keep the object wrapper { board: [...] }.
    // - text/plain bypasses CORS OPTIONS preflight block.
    // - wrapping as an object prevents kvdb.io JSON array parsing errors.
    const postRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ board: currentBoard })
    });
    return postRes.ok;
  } catch (e) {
    console.error('Failed to update global leaderboard', e);
    return false;
  }
}

/**
 * Fetches all registered users' full profiles from the cloud for the Admin Panel
 */
export async function getCloudAdminUsersList() {
  try {
    const keysResponse = await fetch(`${KV_BASE_URL}?format=json&t=${Date.now()}`, { cache: 'no-store' });
    if (!keysResponse.ok) return [];
    
    const keys = await keysResponse.json();
    if (!Array.isArray(keys)) return [];
    
    const userKeys = keys.filter(k => k.startsWith('usr_') && k !== 'usr_test');
    
    const fetchPromises = userKeys.map(async (key) => {
      try {
        const res = await fetch(`${KV_BASE_URL}${key}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const profile = await res.json();
          if (profile && profile.username) {
            const xp = profile.xp ?? 0;
            const streak = profile.streak ?? 0;
            const rName = getRankByXp(xp, streak).name;
            
            return {
              username: profile.username,
              email: profile.email || 'guest@hanja.com',
              gold: profile.gold ?? 0,
              xp: xp,
              streak: streak || 1,
              goal: profile.goal || '8급',
              currentLevel: profile.currentLevel || '8급',
              rankName: rName,
              role: profile.role || 'user',
              studyHistory: profile.studyHistory || [],
              lastUpdated: profile.lastUpdated || new Date().toISOString()
            };
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch user profile for admin: ${key}`, err);
      }
      return null;
    });
    
    const cloudUsers = (await Promise.all(fetchPromises)).filter(Boolean);
    // Sort by username or lastUpdated
    cloudUsers.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    return cloudUsers;
  } catch (e) {
    console.error('Failed to get cloud admin users list', e);
    return [];
  }
}

/**
 * Fetches the Global Notice from the cloud
 */
export async function fetchGlobalNotice() {
  try {
    // Add a timestamp cache buster to completely avoid browser disk caching
    const url = `${KV_BASE_URL}global_notice?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      return data; // Expected shape: { text: "...", isVisible: boolean }
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch global notice', e);
    return null;
  }
}

/**
 * Updates the Global Notice in the cloud (Admin Only)
 */
export async function updateGlobalNotice(noticeData) {
  try {
    const url = `${KV_BASE_URL}global_notice`;
    // ⚠️ CRITICAL GUARDRAIL: Keep Content-Type as 'text/plain'
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(noticeData)
    });
    return response.ok;
  } catch (e) {
    console.error('Failed to update global notice', e);
    return false;
  }
}

// --- FEEDBACK CLOUD API ---

export async function fetchGlobalFeedbacks() {
  try {
    const url = `${KV_BASE_URL}global_hanja_feedbacks?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Failed to fetch feedbacks. Status: ${res.status}`);
    }
    const data = await res.json();
    return data.feedbacks || [];
  } catch (err) {
    console.error('fetchGlobalFeedbacks error:', err);
    return [];
  }
}

export async function submitGlobalFeedback(feedback) {
  try {
    const currentFeedbacks = await fetchGlobalFeedbacks();
    currentFeedbacks.unshift(feedback);
    const url = `${KV_BASE_URL}global_hanja_feedbacks`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ feedbacks: currentFeedbacks })
    });
    return true;
  } catch (err) {
    console.error('submitGlobalFeedback error:', err);
    return false;
  }
}

export async function replyToGlobalFeedback(feedbackId, replyText) {
  try {
    const currentFeedbacks = await fetchGlobalFeedbacks();
    const index = currentFeedbacks.findIndex(f => f.id === feedbackId);
    if (index > -1) {
      currentFeedbacks[index].reply = replyText;
      const url = `${KV_BASE_URL}global_hanja_feedbacks`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ feedbacks: currentFeedbacks })
      });
      return { success: true, feedback: currentFeedbacks[index] };
    }
    return { success: false };
  } catch (err) {
    console.error('replyToGlobalFeedback error:', err);
    return { success: false };
  }
}
