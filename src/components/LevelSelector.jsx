import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, BookOpen, Clock, CloudRain, PenTool } from 'lucide-react';
import { HANJA_LEVELS } from '../services/hanjaDb';
import { getRankByXp, removeWrongHanja } from '../services/mockDb';
import { speakKorean, unlockTtsAudio } from '../utils/tts';

export default function LevelSelector({ selectedLevel, onSelectLevel, onStartMode, soundOn, onToggleSound, profile, onOpenLoginModal, onLogout, onUpdateProfile }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(profile?.username || '');
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'wrong'

  useEffect(() => {
    if (profile?.username) {
      setEditName(profile.username);
    }
  }, [profile?.username]);

  const handleSaveName = () => {
    if (!editName.trim()) return;
    const updated = {
      ...profile,
      username: editName.trim()
    };
    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }
    setIsEditingName(false);
  };

  const handleModeStart = (mode) => {
    // macOS Safari / Chrome 음성 자동재생 권한 획득을 위한 클릭 이벤트 동기화 처리
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
      unlockTtsAudio();
    }
    onStartMode(mode);
  };

  return (
    <div style={{
      maxWidth: '750px',
      margin: '0 auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      textAlign: 'center'
    }}>
      
      {/* Brand Header */}
      <div>
        <h1 className="font-display hero-title" style={{
          margin: '0 0 10px 0',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 4px 10px rgba(16, 185, 129, 0.1)'
        }}>
          한자 마스터<br/>야! 너도 할 수 있어!
        </h1>
        <p className="hero-subtitle" style={{
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
          margin: 0
        }}>
          초등학생부터 성인까지, 게임으로 즐겁게 마스터하는 급수별 배정한자!
        </p>
      </div>

      {/* 🔐 Welcome & Authentication Panel */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {!profile || !profile.isLoggedIn ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
              <span style={{ fontSize: '1.2rem' }}>🔒</span>
              <strong style={{ fontSize: '0.95rem' }}>개인정보 미수집 프로필 연동</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 6px 0', lineHeight: '1.4' }}>
              현재 익명 상태로 수련 중입니다. <strong>구글 또는 카카오 계정을 연동</strong>하시면 개인정보 수집 없이 학습 데이터를 영구히 보존하고 기기 간 복구가 가능해집니다!
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <button
                onClick={onOpenLoginModal}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                계정 연동하기 / 로그인
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={15}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--color-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      width: '120px'
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(profile.username);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <strong className="mobile-welcome-text" style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>
                    {profile.username} 님, 수련을 환영합니다!
                  </strong>
                  <button
                    onClick={() => setIsEditingName(true)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.7rem',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    수정
                  </button>
                </>
              )}
            </div>
            {profile.isPrivacyFirst ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                border: '1.5px solid rgba(16, 185, 129, 0.2)'
              }}>
                <span>🛡️ 개인정보 미수집 프로필</span>
                <span style={{ textTransform: 'capitalize', color: 'var(--color-primary)' }}>({profile.authProvider})</span>
              </div>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                border: '1.5px solid rgba(59, 130, 246, 0.2)'
              }}>
                <span>📧 이메일 프로필</span>
              </div>
            )}
            <p className="mobile-status-text" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              연속 학습: <strong>{profile.streak}일</strong> | 골드: <strong>{profile.gold}G</strong> | 현재 등급: <strong>{getRankByXp(profile.xp).name}</strong>
            </p>
            <button
              onClick={onLogout}
              style={{
                marginTop: '4px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#dc2626',
                border: '1px solid #fee2e2',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              연동 해제 (로그아웃)
            </button>
          </>
        )}

        {/* 📅 Daily Goal Checklist */}
        <div style={{
          marginTop: '8px',
          padding: '12px 14px',
          backgroundColor: '#fffbeb',
          border: '1.5px solid #fef3c7',
          borderRadius: '12px',
          fontSize: '0.78rem',
          color: '#92400e',
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{(profile && profile.streakLastActive === new Date().toISOString().split('T')[0]) ? '✅' : '🔒'}</span>
            <span>오늘의 수련 출석체크 조건 (택 1):</span>
            {(profile && profile.streakLastActive === new Date().toISOString().split('T')[0]) && (
              <span style={{
                marginLeft: 'auto',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.65rem',
                fontWeight: 'bold'
              }}>
                출석 완료!
              </span>
            )}
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.4' }}>
            <li>스피드 퀴즈 1판 완료</li>
            <li>한자비 맞추기 게임 1판 완료</li>
            <li className="mobile-task-text">플래시 카드 50자 학습 (오늘 학습량: <strong>{profile ? profile.flashcardsToday || 0 : 0}</strong> / 50자)</li>
          </ul>
          <div style={{ 
            marginTop: '8px', 
            fontSize: '0.72rem', 
            color: '#b45309', 
            borderTop: '1px dashed #fcd34d', 
            paddingTop: '6px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>💡</span>
            <span><strong>골드 획득 안내:</strong> 골드는 오직 <strong>스피드 퀴즈</strong>와 <strong>한자비 맞추기 게임</strong> 수련을 통해서만 획득 가능합니다. (출석체크 및 쓰기 연습으로는 골드가 지급되지 않습니다)</span>
          </div>
        </div>
      </div>

      {/* Level Selection Control */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(16, 185, 129, 0.03)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
          학습할 한자 급수를 선택하세요
        </label>
        
        <div className="level-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {HANJA_LEVELS.map((lvl) => {
            const isSelected = lvl === selectedLevel;
            return (
              <button
                key={lvl}
                onClick={() => onSelectLevel(lvl)}
                style={{
                  padding: '8px 0',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isSelected ? 'var(--color-primary)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--color-primary)',
                  border: isSelected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Study Modes Grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Mode 1: Flashcards */}
        <div 
          onClick={() => handleModeStart('flashcard')}
          className="study-mode-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            backgroundColor: '#ffffff',
            border: '2px solid var(--color-border)',
            borderRadius: '16px',
            padding: '16px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)',
            height: '110px',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BookOpen size={26} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#1f2937', fontWeight: 'bold' }}>
              플래쉬 카드 연습
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              자동 재생 루프로 보고만 있어도 눈과 귀로 한자(추가되는 배정한자)를 자연스럽게 익힙니다.
            </span>
          </div>
        </div>

        {/* Mode 2: Speed Quiz */}
        <div 
          onClick={() => handleModeStart('speed_quiz')}
          className="study-mode-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            backgroundColor: '#ffffff',
            border: '2px solid var(--color-border)',
            borderRadius: '16px',
            padding: '16px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)',
            height: '110px',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={26} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#1f2937', fontWeight: 'bold' }}>
              스피드 퀴즈
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              제한 시간 5초! 쏟아지는 한자를 보고 5가지 보기 중 알맞은 뜻/음을 재빨리 클릭하세요.
            </span>
          </div>
        </div>

        {/* Mode 3: Rain Game */}
        <div 
          onClick={() => handleModeStart('rain_game')}
          className="study-mode-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            backgroundColor: '#ffffff',
            border: '2px solid var(--color-border)',
            borderRadius: '16px',
            padding: '16px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)',
            height: '110px',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CloudRain size={26} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#1f2937', fontWeight: 'bold' }}>
              한자비 맞추기 게임
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              하늘에서 내리는 한자 비! 바닥에 닿기 전에 올바른 하단 뜻카드를 클릭하여 한자를 터뜨리세요.
            </span>
          </div>
        </div>

        {/* Mode 4: Writing Practice */}
        <div 
          onClick={() => handleModeStart('writing_practice')}
          className="study-mode-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            backgroundColor: '#ffffff',
            border: '2px solid var(--color-border)',
            borderRadius: '16px',
            padding: '16px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)',
            height: '110px',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <PenTool size={26} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#1f2937', fontWeight: 'bold' }}>
              한자쓰기 연습
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              테두리만 있는 한자에 보이지 않는 붓이 지나가며 획순 순서대로 써지는 모습을 관찰합니다.
            </span>
          </div>
        </div>
      </div>

      {/* 📊 나의 학습 현황 및 수련 기록 섹션 */}
      <div style={{
        marginTop: '12px',
        background: '#ffffff',
        border: '1.5px solid var(--color-border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'left',
        boxSizing: 'border-box'
      }}>
        <h2 className="mobile-analysis-title" style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📊</span> 나의 학습 분석 및 오답노트
        </h2>

        {/* 탭 헤더 */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--color-border)',
          marginBottom: '16px',
          gap: '12px'
        }}>
          <button
            onClick={() => setActiveTab('logs')}
            className="mobile-tab-btn"
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: activeTab === 'logs' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'logs' ? '3px solid var(--color-primary)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            수련 기록 로그 📜
          </button>
          <button
            onClick={() => setActiveTab('wrong')}
            className="mobile-tab-btn"
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: activeTab === 'wrong' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'wrong' ? '3px solid var(--color-primary)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            오답노트 ❌ 
            {Object.keys(profile?.wrongHanjaNotes || {}).length > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.72rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 'bold'
              }}>
                {Object.keys(profile.wrongHanjaNotes).length}
              </span>
            )}
          </button>
        </div>

        {/* 탭 내용 */}
        {activeTab === 'logs' ? (
          <div>
            {!profile?.studyHistory || profile.studyHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>📜</p>
                아직 기록된 수련 로그가 없습니다. 스피드 퀴즈나 한자비 맞추기 게임을 시작해 보세요!
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '320px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {profile.studyHistory.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: log.type === '스피드 퀴즈' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: log.type === '스피드 퀴즈' ? 'var(--color-primary)' : '#2563eb',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}>
                            {log.type}
                          </span>
                          <strong style={{ color: '#1f2937' }}>{log.detail}</strong>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{dateStr}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {log.goldEarned > 0 && <span style={{ color: '#d97706' }}>+{log.goldEarned}G</span>}
                        {log.xpEarned > 0 && <span style={{ color: 'var(--color-primary)' }}>+{log.xpEarned}XP</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {!profile?.wrongHanjaNotes || Object.keys(profile.wrongHanjaNotes).length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--color-primary)',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>💯</p>
                오답노트에 기록된 한자가 없습니다! 아주 훌륭합니다.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
                  💡 오답노트에 등록된 한자를 읽어보고, 암기를 완료했다면 <strong>학습 완료 ✅</strong> 버튼을 눌러 리스트에서 삭제하세요.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '12px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {Object.values(profile.wrongHanjaNotes).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#fffdfa',
                        border: '1.5px solid #fed7aa',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* 틀린 횟수 뱃지 */}
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: '#ffedd5',
                        color: '#ea580c',
                        fontSize: '0.62rem',
                        fontWeight: 'bold',
                        padding: '1px 5px',
                        borderRadius: '8px',
                        border: '1px solid #ffdec2'
                      }}>
                        오답 {item.count}회
                      </span>

                      {/* 한자 캐릭터 */}
                      <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#1f2937', marginTop: '6px' }}>
                        {item.char}
                      </span>
                      
                      {/* 음과 뜻 */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#ea580c' }}>
                          {item.meaning} {item.sound}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          급수: {item.level}
                        </div>
                      </div>

                      {/* 컨트롤 버튼 */}
                      <div style={{ display: 'flex', gap: '4px', width: '100%', marginTop: '4px' }}>
                        <button
                          onClick={() => speakKorean(`${item.meaning} ${item.sound}`)}
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            border: 'none',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        >
                          🔊 듣기
                        </button>
                        <button
                          onClick={() => {
                            const updatedNotes = removeWrongHanja(item.id);
                            if (onUpdateProfile) {
                              onUpdateProfile(updatedNotes);
                            }
                          }}
                          style={{
                            flex: 1.2,
                            padding: '4px 0',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-primary)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          ✅ 완료
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
