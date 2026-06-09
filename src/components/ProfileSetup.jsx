import React, { useState } from 'react';
import { Save, Volume2, ArrowLeft, Shield } from 'lucide-react';
import { getRankByXp } from '../services/mockDb';

export default function ProfileSetup({ profile, onUpdateProfile, onNavigate }) {
  const [nickname, setNickname] = useState(profile.username);
  const [goal, setGoal] = useState(profile.goal);
  const [currentLevel, setCurrentLevel] = useState(profile.currentLevel);
  const [feedback, setFeedback] = useState('');

  const currentRank = getRankByXp(profile.xp, profile.streak ?? 0);

  // Play standard Voice synthesis preview
  const playVoicePreview = () => {
    if (!('speechSynthesis' in window)) {
      alert('이 브라우저는 음성 합성 기능을 지원하지 않습니다.');
      return;
    }
    
    window.speechSynthesis.cancel();
    const text = "안녕하십니까. 한자 마스터에 오신 것을 환영합니다. 정진을 격려합니다.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.pitch = 0.95;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setFeedback('사용자 이름을 입력해 주세요.');
      return;
    }

    const updated = {
      ...profile,
      username: nickname,
      goal,
      currentLevel,
      mode: 'general', // Explicitly keep general mode
      voice: 'pro-announcer'
    };

    onUpdateProfile(updated);
    setFeedback('설정이 성공적으로 저장되었습니다! 👍');
    
    // Play confirm voice
    if (profile.soundOn && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("설정이 저장되었습니다.");
      u.lang = 'ko-KR';
      window.speechSynthesis.speak(u);
    }

    setTimeout(() => {
      setFeedback('');
      onNavigate('dashboard');
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '550px', margin: '30px auto', width: '100%', padding: '0 20px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button 
          className="theme-btn theme-btn-secondary" 
          onClick={() => onNavigate('dashboard')}
          style={{ padding: '8px' }}
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-display" style={{ fontSize: '1.5rem', color: 'var(--color-primary)', margin: 0 }}>
          ⚙️ 수련자 프로필 설정
        </h2>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        
        {feedback && (
          <div style={{
            background: 'var(--bg-app)',
            border: '1px dashed var(--color-primary)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '12px',
            marginBottom: '16px',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: 'var(--color-text-main)'
          }}>
            {feedback}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* User Rank Title info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-app)',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--color-border)'
          }}>
            <Shield size={32} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>현재 칭호 및 신분</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                {currentRank.badge} {currentRank.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                누적 경험치: {profile.xp} XP
              </div>
            </div>
          </div>

          {/* User nickname input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>수련자 이름(닉네임)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="이름을 입력하세요"
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--bg-app)',
                color: 'white',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Goal level selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>목표 합격 급수</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--bg-app)',
                color: 'white',
                fontSize: '0.9rem'
              }}
            >
              <option value="8급">8급</option>
              <option value="7급">7급</option>
              <option value="준6급">준6급</option>
            </select>
          </div>

          {/* Current studying level selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>현재 수련 중인 급수</label>
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--bg-app)',
                color: 'white',
                fontSize: '0.9rem'
              }}
            >
              <option value="8급">8급 (기초 배정한자)</option>
              <option value="7급">7급 (초급 배정한자)</option>
              <option value="준6급">준6급 (중급 배정한자)</option>
            </select>
          </div>

          {/* TTS voice setup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>목소리 테마 가이드</label>
            <div style={{
              background: 'var(--bg-app)',
              padding: '16px',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-primary)' }}>아나운서 보이스</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  차분하고 신뢰성 높은 발음 가이드를 전달합니다. (General Mode 고정)
                </div>
              </div>
              
              <button
                type="button"
                className="theme-btn theme-btn-secondary"
                onClick={playVoicePreview}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Volume2 size={14} /> 미리듣기
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="theme-btn theme-btn-primary"
            style={{
              padding: '14px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '10px'
            }}
          >
            <Save size={18} /> 설정 저장하기
          </button>

        </form>

      </div>
    </div>
  );
}
