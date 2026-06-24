import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, CheckCircle2, AlertTriangle, Frown, Lightbulb, Bot } from 'lucide-react';
import { submitGlobalFeedback } from '../services/dbSync';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('suggest'); // 'bug' | 'ux' | 'suggest'
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const panelRef = useRef(null);

  // Close panel if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target) && !event.target.closest('.feedback-trigger-btn')) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    const typeLabel = type === 'bug' ? '기술적 오류' : type === 'ux' ? '사용 불편' : '기능 건의';
    const feedbackData = {
      id: Date.now(),
      category: typeLabel,
      title: `챗봇 제보: ${content.substring(0, 15)}...`,
      body: content,
      author: '익명 제보자',
      reply: null,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
      submitGlobalFeedback(feedbackData).then(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setContent('');
        
        // Also save locally for legacy/optimistic UI fallback
        try {
          const existing = JSON.parse(localStorage.getItem('hanja_feedbacks') || '[]');
          localStorage.setItem('hanja_feedbacks', JSON.stringify([feedbackData, ...existing]));
        } catch (err) {}
      });
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset submitted state after animation finishes
    setTimeout(() => {
      setIsSubmitted(false);
    }, 300);
  };

  return (
    <>
      {/* "불편한 건 알려주세요!" Speech Bubble */}
      {!isOpen && (
        <div
          className="feedback-speech-bubble"
          style={{
            position: 'fixed',
            bottom: '31px',
            right: '90px',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            padding: '8px 14px',
            borderRadius: '16px',
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
            fontSize: '0.82rem',
            fontWeight: 'bold',
            zIndex: 9999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            animation: 'bubbleFloat 3s ease-in-out infinite'
          }}
        >
          <span>불편한 건 알려주세요!</span>
          <span style={{ fontSize: '1rem' }}>💬</span>
          {/* Small Speech Bubble Tail */}
          <div
            style={{
              position: 'absolute',
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: '10px',
              height: '10px',
              backgroundColor: '#ffffff',
              borderRight: '1px solid rgba(16, 185, 129, 0.15)',
              borderTop: '1px solid rgba(16, 185, 129, 0.15)'
            }}
          />
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="feedback-trigger-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'scale(1)',
          outline: 'none'
        }}
        title="개발자에게 피드백 보내기"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Hover effect styling injected via style tag */}
      <style>{`
        .feedback-trigger-btn:hover {
          transform: scale(1.1) ${isOpen ? 'rotate(90deg)' : ''} !important;
          box-shadow: 0 12px 30px -4px rgba(16, 185, 129, 0.6) !important;
        }
      `}</style>

      {/* Floating Feedback Panel Container */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          width: '350px',
          maxWidth: 'calc(100vw - 48px)',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.34, 1.45, 0.64, 1)',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      >
        {/* Header section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
          padding: '20px 20px 16px 20px',
          borderBottom: '1px solid var(--color-border)',
          position: 'relative'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            💬 수련원 개선 및 오류 제보
          </h3>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
            lineHeight: '1.4'
          }}>
            이용 중 불편하신 점이나 개선 건의사항을 남겨주시면 한자 마스터 훈장님(개발자)이 직접 확인하고 수정합니다!
          </p>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content body */}
        <div style={{ padding: '20px', flex: 1 }}>
          {isSubmitted ? (
            /* Success screen state */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 0',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease'
            }}>
              <CheckCircle2 size={48} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#111827', fontWeight: 'bold' }}>
                의견이 성공적으로 접수되었습니다!
              </h4>
              <p style={{
                margin: '0 0 20px 0',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                lineHeight: '1.5',
                padding: '0 8px'
              }}>
                보내주신 소중한 피드백을 하나도 빠짐없이 검토하여 더 쾌적한 학습 서비스로 보답하겠습니다. 정진해주셔서 감사합니다.
              </p>
              <button
                onClick={handleClose}
                className="theme-btn"
                style={{
                  padding: '8px 24px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                닫기
              </button>
            </div>
          ) : (
            /* Form submission screen state */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Feedback type tabs */}
              <div>
                <label style={{
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  피드백 유형
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px'
                }}>
                  {[
                    { id: 'bug', label: '기술 오류', icon: <AlertTriangle size={13} /> },
                    { id: 'ux', label: '사용 불편', icon: <Frown size={13} /> },
                    { id: 'suggest', label: '개선 건의', icon: <Lightbulb size={13} /> }
                  ].map((tab) => {
                    const isSelected = type === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setType(tab.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '8px 4px',
                          fontSize: '0.72rem',
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.05)' : '#ffffff',
                          color: isSelected ? 'var(--color-primary)' : '#4b5563',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text content area */}
              <div>
                <label htmlFor="feedback-content" style={{
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  color: 'var(--color-text-muted)',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  상세 내용
                </label>
                <textarea
                  id="feedback-content"
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? "어떤 화면에서 어떤 오동작이 일어났나요? 버그 현상을 적어주세요."
                      : type === 'ux'
                      ? "사용 중 눈이 아프거나 조작이 어려웠던 점이 있으셨나요? 가감없이 들려주세요."
                      : "추가되었으면 하는 게임 모드나 급수 배정한자 기능 제안을 들려주세요."
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '0.8rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
                />
              </div>


              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: !content.trim() ? 'not-allowed' : 'pointer',
                  opacity: !content.trim() || isSubmitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'opacity 0.2s'
                }}
              >
                {isSubmitting ? (
                  <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <>
                    <Send size={14} />
                    피드백 보내기
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Global CSS for spin, fadeIn and bubbleFloat animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bubbleFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </>
  );
}
