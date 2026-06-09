import React, { useState } from 'react';
import { X, LogIn, UserPlus, Check, ShieldAlert } from 'lucide-react';
import { saveProfileToCloud, loadProfileFromCloud } from '../services/dbSync';

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
  
  // Social sync fields
  const [socialStep, setSocialStep] = useState(null); // null | 'google' | 'kakao'
  const [socialEmail, setSocialEmail] = useState('');
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerTtsFeedback = (text) => {
    // Disabled login/signup voice guidance by user request
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
      username: updatedName,
      authProvider: 'email',
      isPrivacyFirst: false
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
      username: signupUsername,
      authProvider: 'email',
      isPrivacyFirst: false
    };

    setSuccessMsg('회원가입이 완료되었습니다! 자동 로그인되었습니다.');
    triggerTtsFeedback(`${signupUsername}님, 회원가입이 완료되었습니다. 반갑습니다!`);
    onUpdateProfile(updated);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Trigger step 2: email input for social sync
  const handleSocialLoginInit = (provider) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSocialStep(provider);
    setSocialEmail('');
  };

  // Perform actual cloud sync
  const handleSocialLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!socialEmail.trim()) {
      setErrorMsg('동기화에 사용할 이메일 주소를 입력해주세요.');
      return;
    }

    if (!socialEmail.includes('@')) {
      setErrorMsg('올바른 이메일 형식을 입력해주세요 (예: user@example.com).');
      return;
    }

    setIsSubmitting(true);

    try {
      const provider = socialStep;
      const providerName = provider === 'google' ? '구글' : '카카오';
      
      // 1. Try to load existing profile from cloud using the hashed email
      const existingProfile = await loadProfileFromCloud(socialEmail, provider);

      if (existingProfile) {
        // Found existing record on the cloud!
        setSuccessMsg(`[${providerName} 연동 성공] 클라우드에서 이전 기록을 가져왔습니다! (골드: ${existingProfile.gold}G, 연속 학습: ${existingProfile.streak}일)`);
        triggerTtsFeedback(`${existingProfile.username}님, 수련 기록을 클라우드에서 복구했습니다. 반갑습니다!`);
        onUpdateProfile(existingProfile);
        setIsSubmitting(false);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // No existing record. Create a brand new one using the fun nickname generator!
        const adjectives = [
          '피곤한', '해피한', '도전하는', '똑똑한', '귀여운', '열정적인', '도도한', '배고픈', 
          '신비로운', '용맹한', '지혜로운', '씩씩한', '졸린', '노래하는', '바쁜', '상큼한'
        ];
        const nouns = [
          '아이돌', '뽀로로', '선비', '학자', '훈장님', '댕댕이', '냥이', '호랑이', 
          '토끼', '세종대왕', '이순신', '람쥐', '팬더', '루피', '펭수', '어피치'
        ];
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const nickname = `${randomAdj} ${randomNoun}`;

        const newProfile = {
          ...profile,
          isLoggedIn: true,
          username: nickname,
          email: socialEmail.trim().toLowerCase(),
          authProvider: provider,
          isPrivacyFirst: true
        };

        // Save new profile to cloud
        await saveProfileToCloud(newProfile);

        setSuccessMsg(`[${providerName} 연동 성공] 새 프로필 '${nickname}'이 생성 및 동기화되었습니다!`);
        triggerTtsFeedback(`${nickname}님, 계정이 연동되었습니다. 반갑네 수련생!`);
        onUpdateProfile(newProfile);
        setIsSubmitting(false);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('클라우드 동기화 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
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
      zIndex: 10000,
      animation: 'fadeIn 0.25s ease-out'
    }} onClick={onClose}>
      
      {/* Modal Dialog Content Box */}
      <div 
        style={{
          width: '90%',
          maxWidth: '420px',
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          position: 'relative',
          padding: '28px 24px',
          boxSizing: 'border-box',
          color: '#1f2937'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-primary)' }}>
            한자 마스터 수련생 로그인
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
            수련 기록을 안전하게 보존하고 기기 간에 동기화하세요.
          </p>
        </div>

        {socialStep ? (
          <form onSubmit={handleSocialLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <ShieldAlert size={18} color="#1d4ed8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: '#1e40af' }}>
                <strong>{socialStep === 'google' ? 'Google' : 'Kakao'} 연동 이메일 입력</strong><br />
                기기 간 데이터 동기화 및 복구를 위해 사용할 이메일을 입력해 주세요. 이메일은 즉시 단방향 해시(암호화) 처리되어 서버에는 실제 이메일 텍스트가 절대 저장되지 않습니다.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#4b5563' }}>
                동기화용 이메일 주소
              </label>
              <input
                type="email"
                required
                disabled={isSubmitting}
                placeholder="example@gmail.com"
                value={socialEmail}
                onChange={(e) => setSocialEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--color-border)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 'bold', textAlign: 'center' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 'bold', textAlign: 'center' }}>
                ✅ {successMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setSocialStep(null);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#4b5563',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                뒤로가기
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.82rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                {isSubmitting ? '동기화 중...' : '연동 및 동기화 완료'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* 🔒 PRIVACY-FIRST DISCLAIMER BANNER */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <ShieldAlert size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: '#166534' }}>
                <strong>개인정보 미수집 프로필 연동 (Google / Kakao)</strong><br />
                소셜 연동 시 성명, 이메일, 프로필 사진 등 어떠한 개인정보도 서버에 저장하지 않습니다. 오직 기기 간 학습 데이터 식별을 위한 암호화된 무작위 토큰만 생성되므로 안심하셔도 좋습니다.
              </div>
            </div>

            {/* 👥 SOCIAL LOGIN BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {/* Google Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSocialLoginInit('google')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.7 : 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Google 계정으로 익명 연동
              </button>

              {/* Kakao Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSocialLoginInit('kakao')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#fee500',
                  color: '#191919',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.7 : 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fddc00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee500'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.553 1.706 4.8 4.27 6.054-.188.702-.68 2.531-.777 2.916-.122.484.179.478.377.346.155-.103 2.453-1.666 3.447-2.329.544.08 1.103.128 1.683.128 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
                </svg>
                카카오 계정으로 익명 연동
              </button>
            </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0', color: '#cbd5e1' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ padding: '0 10px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>또는 일반 이메일 사용</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'login' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'login' ? 'var(--color-primary)' : '#94a3b8',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={14} /> 로그인
          </button>
          
          <button
            onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'signup' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'signup' ? 'var(--color-primary)' : '#94a3b8',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={14} /> 회원가입
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#ef4444',
            fontSize: '0.8rem',
            marginBottom: '14px',
            textAlign: 'center'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #d1fae5',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'var(--color-primary)',
            fontSize: '0.8rem',
            marginBottom: '14px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Check size={14} /> {successMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 'bold' }}>이메일 또는 아이디</label>
              <input 
                type="text"
                placeholder="example@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 'bold' }}>비밀번호</label>
              <input 
                type="password"
                placeholder="비밀번호 입력"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              type="submit"
              style={{
                padding: '10px',
                fontSize: '0.88rem',
                fontWeight: 'bold',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              로그인 완료
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>사용자 이름</label>
              <input 
                type="text"
                placeholder="홍길동"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>이메일 주소</label>
              <input 
                type="email"
                placeholder="example@email.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>비밀번호</label>
              <input 
                type="password"
                placeholder="비밀번호 설정"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>비밀번호 확인</label>
              <input 
                type="password"
                placeholder="비밀번호 재입력"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              type="submit"
              style={{
                padding: '9px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              회원가입 및 시작하기
            </button>
          </form>
        )}
          </>
        )}
      </div>
    </div>
  );
}
