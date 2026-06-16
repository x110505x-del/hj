import React, { useState, useEffect } from 'react';
import { Share, Download, X, PlusSquare, Smartphone } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed)
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
    
    setIsStandalone(checkStandalone);

    if (checkStandalone) return; // No need to show installation prompt if already installed

    // 2. Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // 3. Handle Chrome/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Show banner after 3 seconds if not dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    };

    if (window.deferredPWAInstallPrompt) {
      handleBeforeInstallPrompt(window.deferredPWAInstallPrompt);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. For iOS: If Safari and not standalone, we can show iOS banner
    // (Chrome on iOS does not support PWA installation, must be Safari)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIosDevice && isSafari) {
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setIsInstallable(true);
        const timer = setTimeout(() => setShowBanner(true), 4000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS step-by-step installation instructions
      setShowIosModal(true);
      setShowBanner(false);
      return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsInstallable(false);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // If already installed, or not installable, or banner is hidden, render nothing
  if (isStandalone || !isInstallable || !showBanner) {
    // We still want to render the iOS modal if it's open
    if (!showIosModal) return null;
  }

  return (
    <>
      {/* Floating Installation Banner */}
      {showBanner && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: '90%',
          maxWidth: '520px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(4, 120, 87, 0.2)',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 12px 30px rgba(4, 120, 87, 0.16)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          boxSizing: 'border-box'
        }}>
          {/* App Icon Circle */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(4, 120, 87, 0.1)',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Custom mini-logo path */}
            <svg width="28" height="28" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#047857" strokeWidth="8" />
              <path d="M36 41 L64 41 M30 54 L70 54 M50 30 C46 51, 38 67, 29 76 M50 54 C55 64, 63 71, 71 76" 
                    stroke="#047857" strokeWidth="8" strokeLinecap="round" fill="none"/>
            </svg>
          </div>

          {/* Banner Text */}
          <div style={{ flex: 1, textAlign: 'left' }}>
            <h4 style={{
              margin: '0 0 2px 0',
              fontSize: '0.92rem',
              fontWeight: 'bold',
              color: '#1e293b',
              letterSpacing: '-0.3px'
            }}>
              한자 마스터 앱 설치하기
            </h4>
            <p style={{
              margin: 0,
              fontSize: '0.76rem',
              color: '#64748b',
              lineHeight: '1.3'
            }}>
              홈 화면에 추가하여 앱처럼 편리하게 학습하고 오프라인에서도 즐겨보세요!
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleInstallClick}
              style={{
                backgroundColor: 'var(--color-primary, #047857)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 10px rgba(4, 120, 87, 0.15)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Download size={14} /> 설치
            </button>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(100, 116, 139, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(100, 116, 139, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(100, 116, 139, 0.08)'}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* iOS Installation Instruction Modal */}
      {showIosModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease-out forwards',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowIosModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              <X size={18} />
            </button>

            {/* Modal Icon Header */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)',
              margin: '0 auto 16px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(4, 120, 87, 0.15)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Smartphone size={32} style={{ color: 'var(--color-primary, #047857)' }} />
            </div>

            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              홈 화면에 추가 (iOS Safari)
            </h3>
            
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '0.82rem',
              color: '#64748b',
              lineHeight: '1.4'
            }}>
              iPhone/iPad에서 한자 마스터를 앱처럼 홈 화면에 추가하고 수련하실 수 있습니다. 아래 순서대로 진행해 주세요!
            </p>

            {/* Instruction Steps */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textAlign: 'left',
              marginBottom: '24px'
            }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{
                  background: 'rgba(4, 120, 87, 0.1)',
                  color: 'var(--color-primary, #047857)',
                  fontWeight: 'bold',
                  fontSize: '0.78rem',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>1</span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: '1.4' }}>
                  Safari 화면 하단의 <strong>'공유' 버튼</strong>을 누릅니다.
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#f1f5f9',
                    borderRadius: '6px',
                    padding: '4px 6px',
                    marginLeft: '4px',
                    verticalAlign: 'middle'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <rect x="5" y="12" width="14" height="10" rx="2" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                      <path d="m16 7-4-4-4 4" />
                    </svg>
                  </span>
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{
                  background: 'rgba(4, 120, 87, 0.1)',
                  color: 'var(--color-primary, #047857)',
                  fontWeight: 'bold',
                  fontSize: '0.78rem',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>2</span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: '1.4' }}>
                  메뉴를 아래로 스크롤하여 <strong>'홈 화면에 추가'</strong>를 탭합니다.
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#f1f5f9',
                    borderRadius: '6px',
                    padding: '4px 6px',
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                    color: '#334155'
                  }}>
                    <PlusSquare size={13} style={{ marginRight: '2px' }} /> 추가
                  </span>
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{
                  background: 'rgba(4, 120, 87, 0.1)',
                  color: 'var(--color-primary, #047857)',
                  fontWeight: 'bold',
                  fontSize: '0.78rem',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>3</span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: '1.4' }}>
                  우측 상단의 <strong>'추가'</strong> 버튼을 클릭하여 완료합니다.
                </p>
              </div>
            </div>

            {/* OK Close button */}
            <button
              onClick={() => setShowIosModal(false)}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-primary, #047857)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.15)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              알겠습니다
            </button>
          </div>
        </div>
      )}

      {/* Add CSS Animations inline to avoid external file coupling issues */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 40px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
