import React, { useState, useEffect } from 'react';
import LevelSelector from './components/LevelSelector';
import Flashcards from './components/Flashcards';
import SpeedQuiz from './components/SpeedQuiz';
import HanjaRainGame from './components/HanjaRainGame';
import HanjaWritingPractice from './components/HanjaWritingPractice';
import FeedbackWidget from './components/FeedbackWidget';
import LoginModal from './components/LoginModal';
import { getProfile, saveProfile } from './services/mockDb';
import { Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState('8급');
  const [currentScreen, setCurrentScreen] = useState('selector'); // 'selector' | 'flashcard' | 'speed_quiz' | 'rain_game' | 'writing_practice'
  const [soundOn, setSoundOn] = useState(true);
  const [profile, setProfile] = useState(() => getProfile());
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLogout = () => {
    const updated = {
      ...profile,
      isLoggedIn: false,
      email: '',
      authProvider: '',
      isPrivacyFirst: false
    };
    setProfile(updated);
    saveProfile(updated);
    
    if (soundOn && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("로그아웃 되었습니다.");
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Scroll to top on screen change to ensure header is visible and content layout is clean
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

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
            <span style={{
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

        {/* Header Profile / Login Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {profile && profile.isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.8rem',
                color: 'var(--color-primary)',
                fontWeight: 'bold',
                background: 'rgba(4, 120, 87, 0.08)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(4, 120, 87, 0.15)'
              }}>
                <span style={{ fontSize: '0.85rem' }}>👤</span>
                <span>{profile.username}</span>
                {profile.isPrivacyFirst && (
                  <span style={{ 
                    fontSize: '0.62rem', 
                    color: '#166534', 
                    background: '#d1fae5', 
                    padding: '1px 5px', 
                    borderRadius: '4px', 
                    marginLeft: '4px',
                    fontWeight: 'bold'
                  }}>
                    익명 🔒
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  border: '1px solid #fee2e2',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                title="로그아웃"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              style={{
                background: 'var(--color-primary)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                padding: '8px 14px',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              로그인 / 회원가입
            </button>
          )}
        </div>
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
          <LevelSelector
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            onStartMode={setCurrentScreen}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            profile={profile}
            onOpenLoginModal={() => setIsLoginOpen(true)}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'flashcard' && (
          <Flashcards
            level={selectedLevel}
            onBack={() => setCurrentScreen('selector')}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
          />
        )}

        {currentScreen === 'speed_quiz' && (
          <SpeedQuiz
            level={selectedLevel}
            onBack={() => setCurrentScreen('selector')}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
          />
        )}

        {currentScreen === 'rain_game' && (
          <HanjaRainGame
            level={selectedLevel}
            onBack={() => setCurrentScreen('selector')}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
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
      </main>

      {/* Footnote */}
      <footer style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: '0.85rem',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: '#ffffff'
      }}>
        &copy; 2026 한자 마스터. All Rights Reserved. | 급수별 한자 게임 수련장 🏆
      </footer>
      
      {/* Floating global feedback widget */}
      <FeedbackWidget />

      {/* 🔐 Authentication Modal Overlay */}
      {isLoginOpen && (
        <LoginModal 
          profile={profile} 
          onUpdateProfile={(updated) => {
            setProfile(updated);
            saveProfile(updated);
          }} 
          onClose={() => setIsLoginOpen(false)} 
        />
      )}
    </div>
  );
}
