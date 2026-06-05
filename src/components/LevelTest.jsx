import React, { useState, useEffect, useRef } from 'react';
import { Timer, AlertCircle, Award, CheckCircle, RefreshCw } from 'lucide-react';
import { HANJA_DATA } from '../services/mockDb';

export default function LevelTest({ profile, onUpdateProfile, onNavigate }) {
  const [stage, setStage] = useState('intro'); // 'intro' | 'playing' | 'result'
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [wrongCardId, setWrongCardId] = useState(null);
  const [errors, setErrors] = useState(0);
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Characters used for testing (drawn from 8급 and 7급)
  const testPool = [
    { id: 'test_dae', char: '大', matchId: 'test_dae', text: '큰 대' },
    { id: 'test_cheon', char: '天', matchId: 'test_cheon', text: '하늘 천' },
    { id: 'test_gu', char: '口', matchId: 'test_gu', text: '입 구' }
  ];

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const startTest = () => {
    // Generate cards list: 3 character cards and 3 meaning cards, shuffled
    const charCards = testPool.map(item => ({
      id: `${item.id}_char`,
      matchId: item.id,
      type: 'char',
      content: item.char
    }));

    const textCards = testPool.map(item => ({
      id: `${item.id}_text`,
      matchId: item.id,
      type: 'text',
      content: item.text
    }));

    const shuffled = [...charCards, ...textCards].sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setMatchedIds([]);
    setErrors(0);
    setTimeElapsed(0);
    setStage('playing');
    setTimerActive(true);
  };

  const handleCardClick = (card) => {
    if (matchedIds.includes(card.matchId) || wrongCardId) return;

    if (!selectedCard) {
      setSelectedCard(card);
      return;
    }

    // If click on the same card, deselect
    if (selectedCard.id === card.id) {
      setSelectedCard(null);
      return;
    }

    // Check match
    if (selectedCard.matchId === card.matchId && selectedCard.type !== card.type) {
      // Match success
      setMatchedIds(prev => [...prev, card.matchId]);
      setSelectedCard(null);

      // Play short chime (optional/mocked)
      if (profile.soundOn && 'speechSynthesis' in window) {
        // Speak small sound or synthesize
        const u = new SpeechSynthesisUtterance("딩동댕");
        u.rate = 2.5;
        u.volume = 0.3;
        window.speechSynthesis.speak(u);
      }
    } else {
      // Match failed
      setErrors(prev => prev + 1);
      setWrongCardId(card.id);
      
      if (profile.soundOn && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("땡");
        u.rate = 2.5;
        u.volume = 0.3;
        window.speechSynthesis.speak(u);
      }

      // Shake animation trigger
      setTimeout(() => {
        setWrongCardId(null);
        setSelectedCard(null);
      }, 800);
    }
  };

  // Check if test is complete
  useEffect(() => {
    if (stage === 'playing' && matchedIds.length === testPool.length) {
      setTimerActive(false);
      setStage('result');
    }
  }, [matchedIds, stage]);

  // AI Recommendation Diagnostic
  const getRecommendation = () => {
    if (timeElapsed <= 10 && errors === 0) {
      return {
        level: '준6급',
        title: '준6급 (중급 난이도) 추천',
        desc: '기초적인 한자의 음과 뜻을 번개 같은 속도로 파악하십니다! 필기 쓰기와 획순 연습이 포함되는 준6급 학습부터 직접 도전하시는 것을 추천합니다.'
      };
    } else if (timeElapsed <= 20 && errors <= 1) {
      return {
        level: '7급',
        title: '7급 (초급 확장) 추천',
        desc: '기본 한자에 대한 식별력이 양호하십니다. 8급보다 조금 더 어휘가 풍부해지는 7급 한자 학습을 이수하시는 것을 강력히 권장합니다.'
      };
    } else {
      return {
        level: '8급',
        title: '8급 (왕기초 입문) 추천',
        desc: '한자를 처음 시작하거나 기초 다지기가 필요한 단계입니다. 큰 글씨와 카드 놀이를 중심으로 8급 50자부터 재미있게 정복해보세요!'
      };
    }
  };

  const recommendation = getRecommendation();

  const applyRecommendation = () => {
    const updated = {
      ...profile,
      currentLevel: recommendation.level,
      goal: recommendation.level
    };
    onUpdateProfile(updated);
    onNavigate('dashboard');
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', width: '100%', padding: '0 20px' }}>
      {stage === 'intro' && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚡</div>
          <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--color-primary)' }}>
            AI 레벨 테스트 & 6자 매칭 게임
          </h2>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            화면에 무작위로 등장하는 3개의 한자 카드와 3개의 뜻/음 카드를 짝을 맞추어 매칭하는 스피드 게임입니다. 
            AI가 매칭 반응 시간과 오답률을 종합 분석하여 당신에게 가장 적합한 급수를 제안합니다.
          </p>
          <button 
            className="theme-btn theme-btn-primary" 
            onClick={startTest}
            style={{ padding: '14px 28px', fontSize: '1.2rem' }}
          >
            수련 실력 테스트 시작!
          </button>
        </div>
      )}

      {stage === 'playing' && (
        <div className="glass-card">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: '2px solid var(--color-border)',
            paddingBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
              <Timer size={18} className="anim-breathe" />
              <span>진행 시간: {timeElapsed}초</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--color-heart)' }}>
              <AlertCircle size={18} />
              <span>실수 횟수: {errors}회</span>
            </div>
          </div>

          <h3 className="font-display" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.2rem' }}>
            서로 알맞은 한자카드와 훈음(뜻/음)카드를 탭하세요!
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {cards.map(card => {
              const isMatched = matchedIds.includes(card.matchId);
              const isSelected = selectedCard?.id === card.id;
              const isWrong = wrongCardId === card.id;

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className={`${isWrong ? 'anim-shake' : ''}`}
                  style={{
                    height: '110px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 'var(--border-radius-md)',
                    border: isSelected 
                      ? '3px solid var(--color-primary)' 
                      : isMatched
                        ? '1px solid transparent'
                        : '2px solid var(--color-border)',
                    background: isMatched
                      ? (profile.mode === 'kids' ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)')
                      : isWrong
                        ? '#fee2e2'
                        : isSelected
                          ? (profile.mode === 'kids' ? '#fffbeb' : 'rgba(99, 102, 241, 0.2)')
                          : 'var(--bg-card)',
                    color: isMatched
                      ? (profile.mode === 'kids' ? '#16a34a' : 'var(--color-accent)')
                      : 'var(--color-text-main)',
                    opacity: isMatched ? 0.6 : 1,
                    cursor: isMatched ? 'default' : 'pointer',
                    fontFamily: card.type === 'char' ? 'var(--font-display)' : 'var(--font-body)',
                    fontSize: card.type === 'char' ? '2.8rem' : '1.3rem',
                    fontWeight: 'bold',
                    boxShadow: isMatched ? 'none' : 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                >
                  {card.content}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stage === 'result' && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', marginBottom: '16px' }}>
            <Award size={48} className="anim-float" style={{ color: 'var(--color-primary)' }} />
          </div>
          
          <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--color-accent)' }}>
            학습 역량 분석 완료!
          </h2>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            margin: '20px 0',
            background: 'var(--bg-app)',
            padding: '16px',
            borderRadius: 'var(--border-radius-md)'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>소요 시간</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{timeElapsed}초</div>
            </div>
            <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>오답 실수</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-heart)' }}>{errors}회</div>
            </div>
          </div>

          <div style={{
            background: profile.mode === 'kids' ? '#eff6ff' : 'rgba(99, 102, 241, 0.1)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <h4 className="font-display" style={{
              fontSize: '1.2rem',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px'
            }}>
              <CheckCircle size={18} />
              {recommendation.title}
            </h4>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-main)' }}>
              {recommendation.desc}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="theme-btn theme-btn-primary" 
              onClick={applyRecommendation}
              style={{ width: '100%', padding: '14px' }}
            >
              추천 급수로 수련 시작하기 🎯
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="theme-btn theme-btn-secondary" 
                onClick={startTest}
                style={{ flex: 1, padding: '10px', fontSize: '0.95rem' }}
              >
                <RefreshCw size={14} /> 다시 하기
              </button>
              <button 
                className="theme-btn theme-btn-secondary" 
                onClick={() => onNavigate('profile_setup')}
                style={{ flex: 1, padding: '10px', fontSize: '0.95rem' }}
              >
                내가 직접 선택하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
