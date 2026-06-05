import React, { useState } from 'react';
import { X, LogIn, UserPlus, Check } from 'lucide-react';

export default function LoginModal({ profile, onUpdateProfile, onClose }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const triggerTtsFeedback = (text) => {
    if (profile.soundOn && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('모든 필드를 입력해 주세요.');
      return;
    }

    // Mock Login Success
    const updatedName = loginEmail.includes('@') ? loginEmail.split('@')[0] : loginEmail;
    const updated = {
      ...profile,
      isLoggedIn: true,
      email: loginEmail,
      username: updatedName
    };

    setSuccessMsg('성공적으로 로그인되었습니다! 환영합니다.');
    triggerTtsFeedback(`${updatedName}님, 로그인 되었습니다. 환영합니다!`);
    onUpdateProfile(updated);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupUsername.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMsg('모든 필드를 입력해 주세요.');
      return;
    }

    if (signupPassword !== signupConfirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    // Mock Sign Up Success
    const updated = {
      ...profile,
      isLoggedIn: true,
      email: signupEmail,
      username: signupUsername
    };

    setSuccessMsg('회원가입이 완료되었습니다! 자동 로그인되었습니다.');
    triggerTtsFeedback(`${signupUsername}님, 회원가입이 완료되었습니다. 반갑습니다!`);
    onUpdateProfile(updated);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(10, 12, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.25s ease-out'
    }} onClick={onClose}>
      
      {/* Modal Dialog Content Box */}
      <div 
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(23, 27, 38, 0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          position: 'relative',
          padding: '24px',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent close on clicking modal interior
      >
        
        {/* Close Icon */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <X size={20} />
        </button>

        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '20px',
          marginTop: '10px'
        }}>
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'login' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'login' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={16} /> 로그인
          </button>
          
          <button
            onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'signup' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'signup' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={16} /> 회원가입
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '10px',
            color: '#ef4444',
            fontSize: '0.85rem',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '10px',
            color: 'var(--color-accent)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Check size={16} /> {successMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>이메일 또는 사용자 이름</label>
              <input 
                type="text"
                placeholder="example@email.com 또는 이름"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>비밀번호</label>
              <input 
                type="password"
                placeholder="비밀번호 입력"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
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

            <button 
              type="submit"
              className="theme-btn theme-btn-primary"
              style={{ padding: '12px', fontSize: '1rem', marginTop: '10px' }}
            >
              로그인 완료
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>사용자 이름</label>
              <input 
                type="text"
                placeholder="홍길동"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--bg-app)',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>이메일 주소</label>
              <input 
                type="email"
                placeholder="example@email.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--bg-app)',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>비밀번호</label>
              <input 
                type="password"
                placeholder="비밀번호 설정"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--bg-app)',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>비밀번호 확인</label>
              <input 
                type="password"
                placeholder="비밀번호 재입력"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--bg-app)',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button 
              type="submit"
              className="theme-btn theme-btn-primary"
              style={{ padding: '10px', fontSize: '0.95rem', marginTop: '10px' }}
            >
              회원가입 및 시작하기
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
