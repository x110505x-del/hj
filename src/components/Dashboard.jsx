import React, { useState } from 'react';
import { BookOpen, Edit3, ShieldAlert, Award, Compass, Calendar, Volume2, ShieldCheck, Flame } from 'lucide-react';
import { checkIn } from '../services/mockDb';

export default function Dashboard({ profile, onUpdateProfile, onNavigate }) {
  const [checkInMsg, setCheckInMsg] = useState('');

  // Daily Streak Check-in trigger
  const handleCheckIn = () => {
    const res = checkIn();
    setCheckInMsg(res.message);
    
    // Play sounds if sound is on
    if (profile.soundOn && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = res.success ? "오늘의 한자 수련 체크인에 성공하였습니다. 화이팅!" : res.message;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    if (res.success) {
      const updated = {
        ...profile,
        streak: res.streak,
        gold: profile.gold + res.goldBonus,
        xp: profile.xp + res.xpBonus,
        streakLastActive: new Date().toISOString().split('T')[0]
      };
      onUpdateProfile(updated);
    }
    
    setTimeout(() => setCheckInMsg(''), 4500);
  };

  return (
    <div style={{
      maxWidth: '850px',
      margin: '20px auto',
      width: '100%',
      padding: '0 20px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Welcome Auth Banner */}
        <div className="glass-card" style={{
          padding: '20px 24px',
          borderLeft: '4px solid var(--color-primary)',
          background: 'rgba(99, 102, 241, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0 }}>
              {profile.isLoggedIn ? `반갑습니다, ${profile.username} 수련자님! 👋` : '한자 마스터 수련원에 오신 것을 환영합니다!'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
              {profile.isLoggedIn 
                ? '계정이 클라우드 동기화 모드로 자동 백업되고 있습니다.' 
                : '우측 상단의 로그인 버튼을 클릭하여 수련 정보를 안전하게 저장하세요!'}
            </p>
          </div>
          {profile.isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <ShieldCheck size={18} />
              <span>실시간 동기화 활성화됨</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              <ShieldAlert size={18} />
              <span>게스트 세션으로 사용 중</span>
            </div>
          )}
        </div>

        {/* Top Split View: Progress & Account info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
          alignItems: 'stretch'
        }} className="general-dashboard-split">
          
          {/* Study Progress Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '14px' }}>
                📊 나의 학습 집중 대시보드
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>현재 수련 급수</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-secondary)', marginTop: '4px' }}>
                    {profile.currentLevel}
                  </div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>목표 합격선</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '4px' }}>
                    {profile.goal} 통과
                  </div>
                </div>
              </div>

              {/* Progress level */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>급수 학습 마스터율</span>
                  <span>{profile.mastered.length}자 암기 완료</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                  <div style={{ width: `${Math.min(100, (profile.mastered.length / 5) * 100)}%`, height: '100%', background: 'var(--color-secondary)' }}></div>
                </div>
              </div>
            </div>

            <div>
              {checkInMsg && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.9rem',
                  color: 'var(--color-accent)',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  {checkInMsg}
                </div>
              )}
              <button 
                className="theme-btn theme-btn-primary" 
                onClick={handleCheckIn}
                style={{ width: '100%', padding: '12px' }}
              >
                오늘의 학습 출석체크인 (🔥 {profile.streak}일 연속 수련)
              </button>
            </div>
          </div>

          {/* Quick Stats side card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
            <h4 className="font-display" style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
              👤 내 계정 현황
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>이름</span>
                <strong>{profile.username}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>누적 경험치</span>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>{profile.xp} XP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>인게임 재화</span>
                <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{profile.gold} Gold</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>수련 복구권</span>
                <span>{profile.inventory.filter(i => i === 'streak_restoration_ticket').length}장 보유</span>
              </div>
            </div>
          </div>
        </div>

        {/* Entry grid */}
        <div>
          <h3 className="font-display" style={{ fontSize: '1.4rem', marginBottom: '12px' }}>✏️ 학습 코스웨이</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }} className="general-entry-grid">
            
            <div 
              onClick={() => onNavigate('flashcards')}
              className="glass-card"
              style={{ cursor: 'pointer', padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <BookOpen size={20} style={{ color: 'var(--color-secondary)' }} />
                <h4 className="font-display" style={{ fontSize: '1.15rem' }}>시청각 플래시 카드</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                배정한자 카드를 3D 뒤집기 기법으로 확인하고, 자동 낭독 오디오 가이드를 통해 암기합니다.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('learning_canvas')}
              className="glass-card"
              style={{ cursor: 'pointer', padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Edit3 size={20} style={{ color: 'var(--color-primary)' }} />
                <h4 className="font-display" style={{ fontSize: '1.15rem' }}>필기 획순 연습장</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                HTML5 인터랙티브 캔버스를 활용하여 획순 가이드를 바탕으로 정확한 자형 필기를 수련합니다.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('quiz_arena')}
              className="glass-card"
              style={{ cursor: 'pointer', padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Award size={20} style={{ color: 'var(--color-accent-pink)' }} />
                <h4 className="font-display" style={{ fontSize: '1.15rem' }}>평가 및 퀴즈 아레나</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                AI 오답 피드백에 따른 맞춤 문제 생성 루프와 마왕 격퇴전 등 학습 효율 극대화 장치 제공.
              </p>
            </div>

          </div>
        </div>

        {/* Word of the Day ticker at the bottom */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-text-muted)' }}>
            💡 오늘의 한자 성어 & 학습 가이드
          </div>
          <div className="ticker-wrap">
            <div className="ticker">
              <div className="ticker-item">溫故知新 (온고지신) : 옛것을 익히고 그것을 미루어서 새것을 안다.</div>
              <div className="ticker-item">結者解之 (결자해지) : 자기가 저지른 일은 자기가 해결해야 한다.</div>
              <div className="ticker-item">刮目相對 (괄목상대) : 눈을 비비고 상대방을 대한다. (실력이 급성장함)</div>
              <div className="ticker-item">💡 한자 마스터 팁: 획순 가이드를 따라 천천히 마우스를 조작하면 획순 일치 판정률이 향상됩니다!</div>
              <div className="ticker-item">溫故知新 (온고지신) : 옛것을 익히고 그것을 미루어서 새것을 안다.</div>
              <div className="ticker-item">結者解之 (결자해지) : 자기가 저지른 일은 자기가 해결해야 한다.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
