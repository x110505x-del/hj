import React, { useState, useEffect } from 'react';
import LevelSelector from './components/LevelSelector';
import Flashcards from './components/Flashcards';
import SpeedQuiz from './components/SpeedQuiz';
import HanjaRainGame from './components/HanjaRainGame';
import HanjaWritingPractice from './components/HanjaWritingPractice';
import HanjaRevealGame from './components/HanjaRevealGame';
import FeedbackWidget from './components/FeedbackWidget';
import LoginModal from './components/LoginModal';
import AdminPanel from './components/AdminPanel';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { getProfile, saveProfile, getKstDateString, DEFAULT_PROFILE } from './services/mockDb';
import { fetchGlobalNotice, fetchGlobalFeedbacks, loadProfileFromCloud, saveProfileToCloud } from './services/dbSync';
import { Volume2, VolumeX } from 'lucide-react';
import { getRadicalsByStrokes, getCumulativeRadicalCards } from './services/radicalDb';

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState('8급');
  const [currentScreen, setCurrentScreen] = useState('selector'); // 'selector' | 'flashcard' | 'speed_quiz' | 'rain_game' | 'writing_practice' | 'reveal_game'
  const [soundOn, setSoundOn] = useState(true);
  const [profile, setProfile] = useState(() => getProfile());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [noticeText, setNoticeText] = useState('');
  const [radicalMode, setRadicalMode] = useState(false);
  const [radicalStrokes, setRadicalStrokes] = useState('all');
  const [isRadicalModalOpen, setIsRadicalModalOpen] = useState(false);
  const [activeRadicalGame, setActiveRadicalGame] = useState(null); // null | 'flashcard' | 'reveal_game' | 'speed_quiz' | 'rain_game'
  const [radicalGameCards, setRadicalGameCards] = useState([]);
  const [guestTimeExpired, setGuestTimeExpired] = useState(false);

  // Guest 1-minute limit monitor
  useEffect(() => {
    if (profile.isLoggedIn) {
      localStorage.removeItem('hanja_guest_start_time');
      setGuestTimeExpired(false);
      return;
    }

    let guestStart = localStorage.getItem('hanja_guest_start_time');
    if (!guestStart) {
      guestStart = Date.now().toString();
      localStorage.setItem('hanja_guest_start_time', guestStart);
    }

    const startTime = parseInt(guestStart, 10);
    const elapsed = Date.now() - startTime;

    if (elapsed >= 60 * 1000) {
      setGuestTimeExpired(true);
      setIsLoginOpen(true);
    } else {
      const remaining = (60 * 1000) - elapsed;
      const timer = setTimeout(() => {
        setGuestTimeExpired(true);
        setIsLoginOpen(true);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [profile.isLoggedIn]);

  // Force dashboard and open login modal if guest time expired
  useEffect(() => {
    if (guestTimeExpired) {
      setCurrentScreen('selector');
      setIsLoginOpen(true);
    }
  }, [guestTimeExpired]);

  useEffect(() => {
    const syncLocalFeedbacks = async () => {
      try {
        const local = JSON.parse(localStorage.getItem('hanja_feedbacks') || '[]');
        const realLocal = local.filter(f => f.id !== 'f1' && f.id !== 'f2');
        if (realLocal.length > 0 && !localStorage.getItem('hanja_feedbacks_synced')) {
          const cloudFeedbacks = await fetchGlobalFeedbacks();
          let merged = [...cloudFeedbacks];
          let changed = false;
          for (let lf of realLocal) {
            if (!merged.find(cf => cf.id === lf.id)) {
              merged.push(lf);
              changed = true;
            }
          }
          if (changed) {
            merged.sort((a, b) => b.id - a.id);
            await fetch('https://kvdb.io/WPnA3ko81FraCfgWmNSzPM/global_hanja_feedbacks', {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({ feedbacks: merged })
            });
          }
          localStorage.setItem('hanja_feedbacks_synced', 'true');
        }
      } catch (e) { console.error('Feedback sync failed', e); }
    };
    syncLocalFeedbacks();
  }, []);

  useEffect(() => {
    if (currentScreen === 'selector') {
      fetchGlobalNotice().then(notice => {
        if (notice && notice.isVisible && notice.text) {
          setNoticeText(notice.text);
          setShowNotice(true);
        } else {
          setShowNotice(false);
          setNoticeText('');
        }
      });
    }
  }, [currentScreen]);

  const handleLogout = () => {
    setProfile(DEFAULT_PROFILE);
    saveProfile(DEFAULT_PROFILE);
  };

  const handleCompleteGame = (goldEarned, xpEarned, isSuccess = true) => {
    const today = getKstDateString();
    let updated = getProfile();

    const isAnon = !updated.isLoggedIn;
    if (isAnon) {
      goldEarned = 0;
      xpEarned = 0;
    }

    // 1. Update overall gold/xp
    updated.gold = (updated.gold || 0) + goldEarned;
    updated.xp = (updated.xp || 0) + xpEarned;

    // 3. Perform daily check-in (streak) if not already done today AND the user earned gold or succeeded!
    let streakMsg = '';
    if ((isSuccess || goldEarned > 0) && updated.streakLastActive !== today && !isAnon) {
      let streak = updated.streak;
      if (updated.streakLastActive) {
        const last = new Date(updated.streakLastActive + 'T00:00:00Z');
        const curr = new Date(today + 'T00:00:00Z');
        const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak += 1;
        } else if (diffDays > 1) {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      updated.streak = streak;
      updated.streakLastActive = today;
      updated.xp += 30; // Daily check-in XP bonus
      streakMsg = `🔥 오늘의 수련 완료! 연속 ${streak}일 출석 성공! (추가 보상: +30 XP)`;
    }

    setProfile(updated);
    saveProfile(updated);
    if (updated.isLoggedIn) {
      saveProfileToCloud(updated);
    }

    if (isAnon) {
      setGuestTimeExpired(true);
      setIsLoginOpen(true);
    } else {
      if (soundOn && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const speechText = isSuccess 
          ? `수련 완료. ${goldEarned} 골드와 ${xpEarned} 경험치를 획득했습니다.`
          : `도전 실패. 하지만 ${goldEarned} 골드와 ${xpEarned} 경험치를 획득했습니다.`;
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'ko-KR';
        window.speechSynthesis.speak(utterance);
      }

      if (streakMsg) {
        alert(`🎉 수련 완료!\n(획득: +${goldEarned} Gold, +${xpEarned} XP)\n\n${streakMsg}`);
      } else {
        if (isSuccess) {
          alert(`🎉 수련 완료!\n(획득: +${goldEarned} Gold, +${xpEarned} XP)`);
        } else {
          alert(`😢 수련 실패!\n미션에 실패했습니다. (출석 불인정)\n(기본 보상 획득: +${goldEarned} Gold, +${xpEarned} XP)`);
        }
      }
    }
  };

  const handleStudyCard = () => {
    const today = getKstDateString();
    let updated = getProfile();

    // 1. Reset daily count if date changed
    if (updated.lastActiveDate !== today) {
      updated.lastActiveDate = today;
      updated.flashcardsToday = 0;
    }

    // 2. Increment count
    updated.flashcardsToday = (updated.flashcardsToday || 0) + 1;

    // 3. Check if they reached exactly 50 cards today and haven't checked in yet
    if (updated.flashcardsToday === 50 && updated.streakLastActive !== today && updated.isLoggedIn) {
      let streak = updated.streak;
      if (updated.streakLastActive) {
        const last = new Date(updated.streakLastActive + 'T00:00:00Z');
        const curr = new Date(today + 'T00:00:00Z');
        const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak += 1;
        } else if (diffDays > 1) {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      updated.streak = streak;
      updated.streakLastActive = today;
      updated.xp += 30; // Daily check-in XP bonus

      if (soundOn && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("오늘의 한자 수련 체크인에 성공하였습니다. 화이팅!");
        utterance.lang = 'ko-KR';
        window.speechSynthesis.speak(utterance);
      }
      alert(`🔥 플래시 카드 50자 학습 완료! 연속 ${streak}일 출석 성공!\n(보상: +30 XP)`);
    } else if (updated.flashcardsToday === 50 && !updated.isLoggedIn) {
      setGuestTimeExpired(true);
      setIsLoginOpen(true);
    }

    setProfile(updated);
    saveProfile(updated);
    if (updated.isLoggedIn) {
      saveProfileToCloud(updated);
    }
  };

  // Scroll to top on screen change to ensure header is visible and content layout is clean
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  // Subscribe to real-time profile changes from mockDb controllers
  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(getProfile());
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // 10-minute automatic logout monitor (Idle timeout & Tab background escape protection)
  useEffect(() => {
    if (!profile.isLoggedIn) return;

    const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    let idleTimer = null;
    let hiddenTimestamp = null;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        handleAutoLogout();
      }, TIMEOUT_MS);
    };

    const handleAutoLogout = () => {
      const updated = {
        ...getProfile(), // read latest profile status from LocalStorage
        isLoggedIn: false,
        email: '',
        authProvider: '',
        isPrivacyFirst: false
      };
      setProfile(updated);
      saveProfile(updated);
      setCurrentScreen('selector'); // reroute to dashboard
      alert("🔒 10분 동안 활동이 없거나 브라우저를 벗어나 자동 로그아웃 되었습니다. 개인정보 보호를 위해 세션을 종료합니다.");
    };

    // User activity listeners
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetIdleTimer);
    });

    // Tab visibility (background execution) handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimestamp = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenTimestamp !== null) {
        const elapsed = Date.now() - hiddenTimestamp;
        if (elapsed >= TIMEOUT_MS) {
          handleAutoLogout();
        } else {
          resetIdleTimer();
        }
        hiddenTimestamp = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    resetIdleTimer(); // start initial countdown

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, resetIdleTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile.isLoggedIn]);

  // Concurrent login monitor
  useEffect(() => {
    if (!profile.isLoggedIn || !profile.email || !profile.loginSessionId) return;

    const checkConcurrentLogin = async () => {
      try {
        const cloudProfile = await loadProfileFromCloud(profile.email, profile.authProvider);
        if (cloudProfile && cloudProfile.loginSessionId) {
          if (cloudProfile.loginSessionId !== profile.loginSessionId) {
            handleLogout();
            alert("⚠️ 다른 기기에서 로그인이 감지되어 자동으로 로그아웃되었습니다.");
            setCurrentScreen('selector');
          }
        }
      } catch (e) {
        console.error("Concurrent login check failed", e);
      }
    };

    const interval = setInterval(checkConcurrentLogin, 30000);
    return () => clearInterval(interval);
  }, [profile.isLoggedIn, profile.email, profile.loginSessionId, profile.authProvider]);

  const handleToggleSound = () => {
    setSoundOn(prev => {
      const nextSound = !prev;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        if (nextSound) {
          const utterance = new SpeechSynthesisUtterance("소리가 켜졌습니다.");
          utterance.lang = 'ko-KR';
          window.speechSynthesis.speak(utterance);
        }
      }
      return nextSound;
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#111827',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Top Banner Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--color-border)',
        padding: '14px 20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <div 
          onClick={() => setCurrentScreen('selector')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          {/* Brand Logo */}
          <svg width="32" height="32" viewBox="0 0 100 100" style={{ display: 'block' }}>
            <circle cx="50" cy="50" r="42" fill="rgba(16, 185, 129, 0.08)" stroke="var(--color-primary)" strokeWidth="6" />
            <rect x="25" y="25" width="50" height="50" rx="6" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeDasharray="3 3" />
            <path 
              d="M30 38 C 45 36, 55 36, 70 38 M 22 55 C 45 52, 55 52, 78 55 M 50 25 C 45 50, 35 70, 24 82 M 50 55 C 56 68, 68 76, 78 82" 
              stroke="var(--color-primary)" 
              strokeWidth="8" 
              strokeLinecap="round" 
              fill="none" 
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.1' }}>
            <span style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: 'var(--color-primary)',
              letterSpacing: '-0.5px'
            }}>
              한자 마스터
            </span>
            <span className="header-subcaption" style={{
              fontSize: '0.65rem',
              color: 'var(--color-text-muted)',
              fontWeight: 'normal',
              marginTop: '2px',
              letterSpacing: '-0.3px'
            }}>
              "한자 검정 능력 시험에 도전 하세요!!"
            </span>
          </div>
        </div>

        {/* Header Profile / Login Section (Removed per user request) */}
      </header>

      {/* Main Container Area */}
      <main style={{
        flex: 1,
        padding: '24px 16px 48px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}>
        {currentScreen === 'selector' && (
          <div style={{ width: '100%', maxWidth: '950px', margin: '0 auto' }}>
            {showNotice && (
              <div style={{
                marginBottom: '20px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🚧</span>
                  <span style={{ color: '#92400e', fontWeight: 'bold', fontSize: 'clamp(0.75rem, 3.5vw, 0.95rem)', whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                    {noticeText}
                  </span>
                </div>
                <button 
                  onClick={() => setShowNotice(false)}
                  style={{
                    background: 'rgba(146, 64, 14, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#92400e',
                    cursor: 'pointer',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(146, 64, 14, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(146, 64, 14, 0.1)'}
                >
                  ✕
                </button>
              </div>
            )}
            <LevelSelector
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
              onStartMode={setCurrentScreen}
              soundOn={soundOn}
              onToggleSound={handleToggleSound}
              profile={profile}
              onOpenLoginModal={() => setIsLoginOpen(true)}
              onLogout={handleLogout}
              onUpdateProfile={(updated) => {
                setProfile(updated);
                saveProfile(updated);
                if (updated.isLoggedIn) {
                  saveProfileToCloud(updated);
                }
              }}
              onStartRadicalFlashcards={(strokes) => {
                setRadicalMode(true);
                setRadicalStrokes(strokes);
                setActiveRadicalGame('flashcard');
                setRadicalGameCards(getRadicalsByStrokes(strokes));
                setIsRadicalModalOpen(false);
              }}
              onStartRadicalReveal={(strokes) => {
                setRadicalMode(true);
                setRadicalStrokes(strokes);
                setActiveRadicalGame('reveal_game');
                setRadicalGameCards(getCumulativeRadicalCards(strokes));
                setIsRadicalModalOpen(false);
              }}
              onStartRadicalSpeedQuiz={(strokes) => {
                setRadicalMode(true);
                setRadicalStrokes(strokes);
                setActiveRadicalGame('speed_quiz');
                setRadicalGameCards(getCumulativeRadicalCards(strokes));
                setIsRadicalModalOpen(false);
              }}
              onStartRadicalRainGame={(strokes) => {
                setRadicalMode(true);
                setRadicalStrokes(strokes);
                setActiveRadicalGame('rain_game');
                setRadicalGameCards(getCumulativeRadicalCards(strokes));
                setIsRadicalModalOpen(false);
              }}
              isRadicalModalOpen={isRadicalModalOpen}
              setIsRadicalModalOpen={setIsRadicalModalOpen}
            />
          </div>
        )}

        {currentScreen === 'flashcard' && !radicalMode && (
          <Flashcards
            level={selectedLevel}
            onBack={() => setCurrentScreen('selector')}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onStudyCard={handleStudyCard}
          />
        )}

        {currentScreen === 'speed_quiz' && !radicalMode && (
          <SpeedQuiz
            level={selectedLevel}
            onBack={() => setCurrentScreen('selector')}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onCompleteGame={handleCompleteGame}
          />
        )}

        {currentScreen === 'rain_game' && !radicalMode && (
          <HanjaRainGame
            level={selectedLevel}
            onBack={() => setCurrentScreen('selector')}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onCompleteGame={handleCompleteGame}
          />
        )}

        {currentScreen === 'writing_practice' && (
          <HanjaWritingPractice
            level={selectedLevel}
            onBack={() => setCurrentScreen('selector')}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
          />
        )}

        {currentScreen === 'reveal_game' && !radicalMode && (
          <HanjaRevealGame
            level={selectedLevel}
            onBack={() => setCurrentScreen('selector')}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onCompleteGame={handleCompleteGame}
          />
        )}

        {radicalMode && activeRadicalGame && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 9998,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              boxSizing: 'border-box',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div 
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: activeRadicalGame === 'rain_game' ? '980px' : (activeRadicalGame === 'flashcard' ? '860px' : '780px'),
                maxHeight: '95vh',
                overflowY: 'auto',
                padding: '24px 20px',
                borderRadius: '24px',
                boxShadow: 'var(--shadow-2xl)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {activeRadicalGame === 'flashcard' && (
                <Flashcards
                  level={radicalStrokes === 'all' ? '전체 부수' : `부수 ${radicalStrokes}획`}
                  customCards={radicalGameCards}
                  isRadicalMode={true}
                  onBack={() => {
                    setActiveRadicalGame(null);
                    setRadicalMode(false);
                    setRadicalGameCards([]);
                    setIsRadicalModalOpen(true);
                  }}
                  soundOn={soundOn}
                  onToggleSound={handleToggleSound}
                  onStudyCard={handleStudyCard}
                />
              )}

              {activeRadicalGame === 'reveal_game' && (
                <HanjaRevealGame
                  level={radicalStrokes === 'all' ? '전체 부수' : `부수 ${radicalStrokes}획`}
                  customCards={radicalGameCards}
                  isRadicalMode={true}
                  onBack={() => {
                    setActiveRadicalGame(null);
                    setRadicalMode(false);
                    setRadicalGameCards([]);
                    setIsRadicalModalOpen(true);
                  }}
                  soundOn={soundOn}
                  onToggleSound={handleToggleSound}
                  onCompleteGame={handleCompleteGame}
                />
              )}

              {activeRadicalGame === 'speed_quiz' && (
                <SpeedQuiz
                  level={radicalStrokes === 'all' ? '전체 부수' : `부수 ${radicalStrokes}획`}
                  customCards={radicalGameCards}
                  isRadicalMode={true}
                  onBack={() => {
                    setActiveRadicalGame(null);
                    setRadicalMode(false);
                    setRadicalGameCards([]);
                    setIsRadicalModalOpen(true);
                  }}
                  soundOn={soundOn}
                  onToggleSound={handleToggleSound}
                  onCompleteGame={handleCompleteGame}
                />
              )}

              {activeRadicalGame === 'rain_game' && (
                <HanjaRainGame
                  level={radicalStrokes === 'all' ? '전체 부수' : `부수 ${radicalStrokes}획`}
                  customCards={radicalGameCards}
                  isRadicalMode={true}
                  onBack={() => {
                    setActiveRadicalGame(null);
                    setRadicalMode(false);
                    setRadicalGameCards([]);
                    setIsRadicalModalOpen(true);
                  }}
                  soundOn={soundOn}
                  onToggleSound={handleToggleSound}
                  onCompleteGame={handleCompleteGame}
                />
              )}
            </div>
          </div>
        )}

        {currentScreen === 'admin' ? (
          profile && profile.isLoggedIn && profile.email === 'x110505x@gmail.com' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left', maxWidth: '950px', margin: '0 auto', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
                <button
                  onClick={() => setCurrentScreen('selector')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    backgroundColor: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  ← 대시보드로 돌아가기
                </button>
              </div>
              <AdminPanel profile={profile} />
            </div>
          ) : (
            <div className="glass-card" style={{ maxWidth: '480px', margin: '60px auto', textAlign: 'center', padding: '40px 24px' }}>
              <span style={{ fontSize: '3rem' }}>🔒</span>
              <h2 className="font-display" style={{ color: 'var(--color-accent-pink)', fontSize: '1.5rem', margin: '16px 0 8px 0' }}>
                접근 권한이 제한되었습니다
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: '1.5' }}>
                수련원 관리자 통제실은 지정된 개발자 계정<br/>
                <strong>(x110505x@gmail.com)</strong>으로 로그인했을 때만 접근하실 수 있습니다.
              </p>
              <button onClick={() => setCurrentScreen('selector')} className="theme-btn theme-btn-primary" style={{ width: '100%' }}>
                대시보드로 돌아가기
              </button>
            </div>
          )
        ) : null}
      </main>

      {/* Footnote */}
      <footer className="footer-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span className="desktop-footer-text">&copy; 2026 Developed by Choi Hyeon-sook</span>
        <span className="mobile-footer-text">&copy; 2026 Developed by Choi Hyeon-sook</span>
        {profile && profile.isLoggedIn && profile.email === 'x110505x@gmail.com' && (
          <>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <button
              onClick={() => setCurrentScreen('admin')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: 'inherit',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              🛡️ 통제실
            </button>
          </>
        )}
      </footer>
      
      {/* Floating global feedback widget - Shown ONLY on main Selector Dashboard */}
      {currentScreen === 'selector' && <FeedbackWidget />}

      {/* Floating PWA Install Prompt - Shown ONLY on main Selector Dashboard */}
      {currentScreen === 'selector' && <PwaInstallPrompt />}

      {/* 🔐 Authentication Modal Overlay */}
      {isLoginOpen && (
        <LoginModal 
          profile={profile} 
          isGuestLocked={guestTimeExpired}
          onUpdateProfile={(updated) => {
            setProfile(updated);
            saveProfile(updated);
          }} 
          onClose={() => {
            if (!guestTimeExpired) {
              setIsLoginOpen(false);
            }
          }} 
        />
      )}
    </div>
  );
}
