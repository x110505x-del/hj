import React, { useState, useEffect } from 'react';
import { X, Check, ShieldAlert, AlertTriangle } from 'lucide-react';
import { saveProfileToCloud, loadProfileFromCloud } from '../services/dbSync';
import { OAUTH_CONFIG } from '../config';

export default function LoginModal({ profile, onUpdateProfile, onClose }) {
  // Social sync steps: null | 'google' | 'kakao'
  const [socialStep, setSocialStep] = useState(null); 
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically load Google/Kakao SDK scripts if sandbox mode is disabled
  useEffect(() => {
    if (OAUTH_CONFIG.USE_SANDBOX_DEV_MODE) return;

    // 1. Google SDK
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // 2. Kakao SDK
    if (!window.Kakao) {
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.async = true;
      script.onload = () => {
        if (window.Kakao && OAUTH_CONFIG.KAKAO_JS_KEY !== 'YOUR_KAKAO_JAVASCRIPT_KEY') {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(OAUTH_CONFIG.KAKAO_JS_KEY);
          }
        }
      };
      document.body.appendChild(script);
    } else {
      if (window.Kakao && OAUTH_CONFIG.KAKAO_JS_KEY !== 'YOUR_KAKAO_JAVASCRIPT_KEY') {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(OAUTH_CONFIG.KAKAO_JS_KEY);
        }
      }
    }
  }, []);

  // Common handler to process both real login & signup
  const processLoginOrSignup = async (email, name, provider) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const providerName = provider === 'google' ? '구글' : '카카오';
      
      // 1. Try to load existing profile from the cloud
      const existingProfile = await loadProfileFromCloud(email, provider);
      const newSessionId = Date.now() + '_' + Math.random().toString(36).substring(2);

      if (existingProfile) {
        existingProfile.loginSessionId = newSessionId;
        setSuccessMsg(`[${providerName} 로그인 완료] 수련 기록을 클라우드에서 안전하게 복구했습니다! (골드: ${existingProfile.gold}G, 연속 학습: ${existingProfile.streak}일)`);
        onUpdateProfile(existingProfile);
        setIsSubmitting(false);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // 2. Profile not found -> Auto-register immediately!
        const cleanName = name ? name.trim() : `${providerName} 수련생`;
        const newProfile = {
          ...profile,
          isLoggedIn: true,
          email: email.trim().toLowerCase(),
          username: cleanName,
          authProvider: provider,
          isPrivacyFirst: true,
          loginSessionId: newSessionId
        };

        // Write new profile to public cloud
        await saveProfileToCloud(newProfile);

        setSuccessMsg(`[${providerName} 회원가입 완료] 새 수련생 계정 '${cleanName}'이 정상 등록되었습니다!`);
        onUpdateProfile(newProfile);
        setIsSubmitting(false);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Auth process error:", error);
      setErrorMsg('클라우드 동기화 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  // Google Login Actions
  const handleGoogleClick = () => {
    if (OAUTH_CONFIG.USE_SANDBOX_DEV_MODE) {
      // Open sandbox selector
      setSocialStep('google');
      setSocialEmail('');
      setSocialName('');
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      handleRealGoogleLogin();
    }
  };

  const handleRealGoogleLogin = () => {
    if (OAUTH_CONFIG.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      setErrorMsg('Google Client ID가 설정되지 않았습니다. src/config.js 파일을 설정해 주세요.');
      return;
    }
    if (!window.google) {
      setErrorMsg('Google SDK가 아직 로드되지 않았습니다. 인터넷 상태를 확인해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      window.google.accounts.id.initialize({
        client_id: OAUTH_CONFIG.GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            // Client-side decode of JWT credential returned from Google
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const payload = JSON.parse(jsonPayload);
            const email = payload.email;
            const name = payload.name || payload.given_name || '구글 사용자';

            await processLoginOrSignup(email, name, 'google');
          } catch (e) {
            console.error("Google token decode error:", e);
            setErrorMsg('구글 로그인 응답 데이터 디코딩에 실패했습니다.');
            setIsSubmitting(false);
          }
        }
      });
      window.google.accounts.id.prompt();
    } catch (err) {
      console.error("Google Auth execution error:", err);
      setErrorMsg('구글 인증을 실행하는 중에 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  // Kakao Login Actions
  const handleKakaoClick = () => {
    if (OAUTH_CONFIG.USE_SANDBOX_DEV_MODE) {
      // Open sandbox selector
      setSocialStep('kakao');
      setSocialEmail('');
      setSocialName('');
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      handleRealKakaoLogin();
    }
  };

  const handleRealKakaoLogin = () => {
    if (OAUTH_CONFIG.KAKAO_JS_KEY === 'YOUR_KAKAO_JAVASCRIPT_KEY') {
      setErrorMsg('Kakao JavaScript Key가 설정되지 않았습니다. src/config.js 파일을 설정해 주세요.');
      return;
    }
    if (!window.Kakao) {
      setErrorMsg('카카오 SDK가 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      window.Kakao.Auth.login({
        success: function(authObj) {
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: async function(res) {
              const email = res.kakao_account.email;
              const nickname = res.properties.nickname || '카카오 사용자';

              if (!email) {
                // If user declined email consent, generate unique identifier using internal ID
                const fallbackEmail = `${res.id}@kakao.user`;
                await processLoginOrSignup(fallbackEmail, nickname, 'kakao');
              } else {
                await processLoginOrSignup(email, nickname, 'kakao');
              }
            },
            fail: function(err) {
              console.error("Kakao profile request error:", err);
              setErrorMsg('카카오 사용자 프로필을 불러오지 못했습니다.');
              setIsSubmitting(false);
            }
          });
        },
        fail: function(err) {
          console.error("Kakao Login OAuth failure:", err);
          setErrorMsg('카카오 로그인 인증이 취소되거나 실패했습니다.');
          setIsSubmitting(false);
        }
      });
    } catch (err) {
      console.error("Kakao Auth execution error:", err);
      setErrorMsg('카카오 인증 처리 도중 에러가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  // Simulated Login Submit in Sandbox Dev Mode
  const handleSandboxSubmit = (e) => {
    e.preventDefault();
    if (!socialEmail.trim()) {
      setErrorMsg('이메일 주소를 입력해 주세요.');
      return;
    }
    if (!socialEmail.includes('@')) {
      setErrorMsg('올바른 이메일 형식을 입력해 주세요.');
      return;
    }
    if (!socialName.trim()) {
      setErrorMsg('사용자 이름을 입력해 주세요.');
      return;
    }

    processLoginOrSignup(socialEmail.trim(), socialName.trim(), socialStep);
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
          maxWidth: '425px',
          background: '#ffffff',
          border: '1.5px solid var(--color-border)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          position: 'relative',
          padding: '30px 24px',
          boxSizing: 'border-box',
          color: '#1f2937',
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
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
          <X size={22} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {OAUTH_CONFIG.USE_SANDBOX_DEV_MODE && (
            <span style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              marginBottom: '10px',
              border: '1px solid #fde68a'
            }}>
              ⚠️ 개발자 테스트 샌드박스 모드 활성
            </span>
          )}
          <h2 style={{ fontSize: '1.45rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--color-primary)', letterSpacing: '-0.5px' }}>
            한자 마스터 계정 로그인
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.4' }}>
            실제 사용하시는 구글 또는 카카오 계정으로 연동하여<br />
            기기 간 수련 기록을 안전하게 복구 및 동기화하세요.
          </p>
        </div>

        {socialStep ? (
          /* 🧪 SANDBOX SIMULATOR INPUT FORM */
          <form onSubmit={handleSandboxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <ShieldAlert size={18} color="#1d4ed8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.75rem', lineHeight: '1.45', color: '#1e40af' }}>
                <strong>{socialStep === 'google' ? 'Google' : 'Kakao'} OAuth 시뮬레이터</strong><br />
                출시 버전에서는 구글/카카오 공식 모바일 로그인 창이 열립니다. 현재는 개발자 테스트를 위한 샌드박스 로그인 모드이므로, 아래 계정 정보를 가상으로 입력해 주세요.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4b5563' }}>이메일 주소</label>
              <input
                type="email"
                required
                disabled={isSubmitting}
                placeholder="testuser@gmail.com"
                value={socialEmail}
                onChange={(e) => setSocialEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-border)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4b5563' }}>사용자 이름 (별명)</label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="한자초보"
                value={socialName}
                onChange={(e) => setSocialName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
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
                  padding: '11px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#4b5563',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '11px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? '연동 중...' : '계정 정보 전송'}
              </button>
            </div>
          </form>
        ) : (
          /* 👥 REAL OAUTH SELECTION VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Disclaimer banner */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <ShieldAlert size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.75rem', lineHeight: '1.45', color: 'var(--color-text-muted)' }}>
                <strong>안전한 연동 정보 보장</strong><br />
                소셜 연동 과정에서 어떠한 개인 비밀번호나 민감한 정보도 본 서비스에 수집 및 저장되지 않습니다. 계정이 없다면 로그인 완료 즉시 자동으로 회원가입 처리됩니다.
              </div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#ffffff'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Google 계정으로 로그인 / 가입
            </button>

            {/* Kakao Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleKakaoClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#fee500',
                color: '#191919',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#fddc00'; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#fee500'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.553 1.706 4.8 4.27 6.054-.188.702-.68 2.531-.777 2.916-.122.484.179.478.377.346.155-.103 2.453-1.666 3.447-2.329.544.08 1.103.128 1.683.128 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
              </svg>
              카카오 계정으로 로그인 / 가입
            </button>

            {/* Status Feedback Messages */}
            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ef4444',
                fontSize: '0.8rem',
                marginTop: '10px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #d1fae5',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--color-primary)',
                fontSize: '0.8rem',
                marginTop: '10px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                ✅ {successMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
