import React from 'react';
import { Volume2, VolumeX, Flame, Coins, Shield, LogIn, LogOut, User, MessageSquare, Settings } from 'lucide-react';
import { getRankByXp } from '../services/mockDb';

export default function Navbar({ profile, onUpdateProfile, currentScreen, onNavigate, onOpenLoginModal }) {
  const currentRank = getRankByXp(profile.xp, profile.streak ?? 0);

  const toggleSound = () => {
    onUpdateProfile({
      ...profile,
      soundOn: !profile.soundOn
    });
  };

  const handleLogout = () => {
    const updated = {
      ...profile,
      isLoggedIn: false,
      email: '',
      role: 'user' // Reset to default user role
    };
    onUpdateProfile(updated);
    onNavigate('dashboard');
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    onUpdateProfile({
      ...profile,
      role: newRole
    });
    
    if (newRole === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <header className="glass-navbar">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        padding: '0 20px',
        boxSizing: 'border-box'
      }} className="navbar-content">
        
        {/* Left Side: Brand Calligraphy Logo & Title */}
        <div 
          onClick={() => onNavigate('dashboard')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {/* Custom SVG Calligraphy Seal Stamp Logo */}
          <svg width="34" height="34" viewBox="0 0 100 100" style={{ display: 'block' }}>
            <circle cx="50" cy="50" r="42" fill="rgba(16, 185, 129, 0.08)" stroke="var(--color-primary)" strokeWidth="6" />
            <rect x="25" y="25" width="50" height="50" rx="6" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeDasharray="3 3" />
            {/* Calligraphy Brush stroke (Hanja letter '天') */}
            <path 
              d="M30 38 C 45 36, 55 36, 70 38 M 22 55 C 45 52, 55 52, 78 55 M 50 25 C 45 50, 35 70, 24 82 M 50 55 C 56 68, 68 76, 78 82" 
              stroke="var(--color-primary)" 
              strokeWidth="8" 
              strokeLinecap="round" 
              fill="none" 
            />
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.1' }}>
            <h1 className="font-display" style={{
              fontSize: '1.25rem',
              margin: 0,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              한자 마스터
            </h1>
            <span style={{
              fontSize: '0.62rem',
              color: 'var(--color-text-muted)',
              fontWeight: 'normal',
              marginTop: '2px',
              letterSpacing: '-0.3px'
            }}>
              우리 한자검정능력시험 한번 도전?
            </span>
          </div>
        </div>

        {/* Middle Area: Navigation links */}
        <nav style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }} className="nav-links">
          <button 
            className={`nav-link ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            대시보드
          </button>
          
          <button 
            className={`nav-link ${currentScreen === 'level_test' ? 'active' : ''}`}
            onClick={() => onNavigate('level_test')}
          >
            진단테스트
          </button>

          <button 
            className={`nav-link ${currentScreen === 'shop' ? 'active' : ''}`}
            onClick={() => onNavigate('shop')}
          >
            상점
          </button>

          <button 
            className={`nav-link ${currentScreen === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onNavigate('leaderboard')}
          >
            랭킹
          </button>

          <button 
            className={`nav-link ${currentScreen === 'feedback' ? 'active' : ''}`}
            onClick={() => onNavigate('feedback')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <MessageSquare size={14} />
            건의게시판
          </button>

          {profile.role === 'admin' && (
            <button 
              className={`nav-link ${currentScreen === 'admin' ? 'active' : ''}`}
              onClick={() => onNavigate('admin')}
              style={{
                color: '#b91c1c',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                fontWeight: 'bold'
              }}
            >
              🛡️ 관리자모드
            </button>
          )}
        </nav>

        {/* Right Side: Account and stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }} className="nav-right">
          
          {/* Quick Role Switcher for local review */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="테스트용 권한 변경 스위치">
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>권한:</span>
            <select
              value={profile.role}
              onChange={handleRoleChange}
              style={{
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '4px 6px',
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <option value="user">일반 회원</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          
          {/* Status info bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(4, 120, 87, 0.04)',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid var(--color-border)'
          }} className="navbar-stats">
            
            {/* Streak */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-primary)' }} title="연속 학습일 수">
              <Flame size={14} fill="currentColor" />
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{profile.streak}일</span>
            </div>

            {/* Gold */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-gold)' }} title="보유 골드">
              <Coins size={14} fill="currentColor" />
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{profile.gold}G</span>
            </div>

          </div>

          {/* Sound Toggle */}
          <button 
            onClick={toggleSound}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.7)',
              border: '1px solid var(--color-border)'
            }}
            title={profile.soundOn ? '음성 켜짐' : '음성 무음'}
          >
            {profile.soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Edit profile settings button */}
          <button
            onClick={() => onNavigate('profile_setup')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.7)',
              border: '1px solid var(--color-border)'
            }}
            title="환경 설정"
          >
            <Settings size={15} />
          </button>

          {/* AUTHENTICATION BUTTON / PROFILE */}
          {profile.isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="auth-profile">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.8rem',
                color: 'var(--color-primary)',
                fontWeight: 'bold',
                background: 'rgba(4, 120, 87, 0.08)',
                padding: '4px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(4, 120, 87, 0.15)'
              }}>
                <User size={13} />
                <span>{profile.username}</span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.75rem',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  border: '1px solid var(--color-border)'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
                title="로그아웃"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
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
                padding: '8px 12px',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <LogIn size={13} /> 로그인
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
