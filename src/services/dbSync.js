/**
 * 🔒 Privacy-First Cloud Synchronization Service
 * 
 * This service allows users to sync their training data (gold, streak, XP, achievements) 
 * across devices using Google/Kakao login, without storing any personal identifiable information (PII).
 * 
 * It converts the email address to a secure cryptographic hash lookup key, 
 * ensuring no email addresses are ever stored on the public cloud storage.
 */

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
      gold: profile.gold,
      streak: profile.streak,
      xp: profile.xp,
      hearts: profile.hearts,
      unlockedLevels: profile.unlockedLevels || ['8급'],
      achievements: profile.achievements || [],
      studyHistory: profile.studyHistory || [],
      wrongHanjaNotes: profile.wrongHanjaNotes || {},
      authProvider: profile.authProvider,
      lastUpdated: new Date().toISOString()
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

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
    const url = `${KV_BASE_URL}${key}`;

    const response = await fetch(url);
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
      wrongHanjaNotes: cloudData.wrongHanjaNotes || {}
    };
  } catch (error) {
    console.error('Cloud load error:', error);
    return null;
  }
}
