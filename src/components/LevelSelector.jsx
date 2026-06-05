import { Volume2, VolumeX, BookOpen, Clock, CloudRain, PenTool } from 'lucide-react';
import { HANJA_LEVELS } from '../services/hanjaDb';

import { unlockTtsAudio } from '../utils/tts';

export default function LevelSelector({ selectedLevel, onSelectLevel, onStartMode, soundOn, onToggleSound }) {
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
        <h1 className="font-display" style={{
          fontSize: '2.5rem',
          margin: '0 0 10px 0',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 4px 10px rgba(16, 185, 129, 0.1)'
        }}>
          한자 검정 능력시험 도전하기
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
          margin: 0
        }}>
          초등학생부터 성인까지, 게임으로 즐겁게 마스터하는 급수별 배정한자!
        </p>
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
        
        <div style={{
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
              한자 비 내리기 게임 (산성비)
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              하늘에서 내리는 한자 비! 바닥에 닿기 전에 올바른 하단 뜻카드를 클릭하여 한자를 터뜨리세요.
            </span>
          </div>
        </div>

        {/* Mode 4: Writing Practice */}
        <div 
          onClick={() => handleModeStart('writing_practice')}
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

    </div>
  );
}
