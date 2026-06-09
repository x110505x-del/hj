import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RefreshCw, Trophy, Target, Award, ArrowLeft, Clock } from 'lucide-react';
import { getHanjaByLevel } from '../services/hanjaDb';

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function HanjaRevealGame({ level, onBack, soundOn, onToggleSound, onCompleteGame }) {
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  const [quizQueue, setQuizQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState([]);
  
  const [revealLevel, setRevealLevel] = useState(1); // 1 to 4
  const [timeLeft, setTimeLeft] = useState(4); // 4 seconds per reveal level
  const [feedback, setFeedback] = useState(null);

  const timerRef = useRef(null);

  const REVEAL_PHASE_SECONDS = 4;
  const TOTAL_QUESTIONS = 50;

  // Sound effects
  const playSound = (type) => {
    if (!soundOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }

    setTimeout(() => {
      if (ctx.state !== 'closed') ctx.close();
    }, 400);
  };

  const startGame = () => {
    const rawData = getHanjaByLevel(level);
    if (!rawData || rawData.length === 0) {
      alert('해당 급수의 한자 데이터가 없습니다.');
      onBack();
      return;
    }
    
    // Select 50 random characters
    const shuffled = shuffleArray(rawData).slice(0, TOTAL_QUESTIONS);
    setQuizQueue(shuffled);
    setScore(0);
    setCorrectCount(0);
    setCurrentIndex(0);
    setGameState('playing');
    setupQuestion(shuffled, 0, rawData);
  };

  const setupQuestion = (queue, index, fullDb) => {
    setRevealLevel(1);
    setTimeLeft(REVEAL_PHASE_SECONDS);
    setFeedback(null);
    
    const target = queue[index];
    const pool = fullDb.filter(h => h.char !== target.char);
    const distractors = shuffleArray(pool).slice(0, 4);
    
    const options = shuffleArray([target, ...distractors]);
    setCurrentOptions(options);
  };

  useEffect(() => {
    if (gameState === 'playing' && !feedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time is up for this phase
            if (revealLevel < 4) {
              setRevealLevel(lvl => lvl + 1);
              return REVEAL_PHASE_SECONDS;
            } else {
              // Level 4 time expired -> Wrong answer
              handleTimeOut();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, revealLevel, feedback]);

  const handleTimeOut = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSound('wrong');
    showFeedbackAndNext('wrong', 0);
  };

  const handleAnswer = (option) => {
    if (feedback || gameState !== 'playing') return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    const target = quizQueue[currentIndex];
    if (option.char === target.char) {
      playSound('correct');
      // Calculate score based on reveal level (faster guess = more points)
      // Level 1: 20, Level 2: 15, Level 3: 10, Level 4: 5
      const points = (5 - revealLevel) * 5;
      setScore(s => s + points);
      setCorrectCount(c => c + 1);
      showFeedbackAndNext('correct', points);
    } else {
      playSound('wrong');
      showFeedbackAndNext('wrong', 0);
    }
  };

  const showFeedbackAndNext = (type, pts) => {
    setFeedback({ type, pts });
    
    setTimeout(() => {
      if (currentIndex + 1 >= quizQueue.length) {
        setGameState('gameover');
      } else {
        setupQuestion(quizQueue, currentIndex + 1, getHanjaByLevel(level));
        setCurrentIndex(i => i + 1);
      }
    }, 1000);
  };

  const finishGameAndClaim = () => {
    // Earn 1 gold per correct answer in this game
    const goldEarned = correctCount;
    // 5 XP per correct answer
    const xpEarned = correctCount * 5;
    
    onCompleteGame(goldEarned, xpEarned, correctCount > 0);
    onBack();
  };

  // Rendering Game Over
  if (gameState === 'gameover') {
    return (
      <div style={{
        maxWidth: '500px', margin: '0 auto', padding: '24px',
        backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: 'var(--shadow-lg)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
          margin: '0 auto 16px auto'
        }}>
          <Trophy size={36} />
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary)', margin: '0 0 8px 0', fontWeight: 'bold' }}>
          수련 완료!
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>가려진 한자 맞추기 50문제를 완주했습니다.</p>
        
        <div style={{
          background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '12px',
          padding: '20px', display: 'flex', justifyContent: 'space-around', marginBottom: '24px'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>정답 횟수</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{correctCount} / {TOTAL_QUESTIONS}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)' }} />
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>획득 점수</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{score}점</div>
          </div>
        </div>

        <button onClick={finishGameAndClaim} className="theme-btn theme-btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold' }}>
          보상 수령하고 목록으로 돌아가기
        </button>
      </div>
    );
  }

  // Rendering Start Screen
  if (gameState === 'ready') {
    return (
      <div style={{
        maxWidth: '600px', margin: '0 auto', padding: '24px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'
      }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)', margin: 0, fontWeight: 'bold' }}>
          가려진 한자 맞추기
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
          한자가 처음에는 아랫부분만 살짝 보입니다.<br/>
          시간이 지날수록 조금씩 가려진 부분이 위로 올라가며 정체를 드러냅니다.<br/>
          <strong>최대한 가려진 상태(1단계)에서 정답을 맞출수록 아주 높은 점수를 받습니다!</strong>
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onToggleSound} className="theme-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backgroundColor: '#ffffff' }}>
            {soundOn ? <Volume2 size={16} color="var(--color-primary)"/> : <VolumeX size={16} color="#ef4444"/>}
            {soundOn ? '효과음 켜짐' : '효과음 꺼짐'}
          </button>
        </div>

        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', fontSize: '0.85rem', color: '#92400e', textAlign: 'left', width: '100%'
        }}>
          <strong>득점 규칙:</strong><br/>
          • 1단계 (25% 노출) 정답: 20점<br/>
          • 2단계 (50% 노출) 정답: 15점<br/>
          • 3단계 (75% 노출) 정답: 10점<br/>
          • 4단계 (100% 노출) 정답: 5점<br/>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button onClick={onBack} className="theme-btn" style={{ flex: 1, padding: '12px', fontSize: '1rem' }}>
            목록으로
          </button>
          <button onClick={startGame} className="theme-btn theme-btn-primary" style={{ flex: 1, padding: '12px', fontSize: '1rem', fontWeight: 'bold' }}>
            게임 시작
          </button>
        </div>
      </div>
    );
  }

  // Rendering Game Play
  const target = quizQueue[currentIndex];
  
  // Calculate clip-path based on revealLevel
  // level 1: show bottom 25% => inset(75% 0 0 0)
  // level 2: show bottom 50% => inset(50% 0 0 0)
  // level 3: show bottom 75% => inset(25% 0 0 0)
  // level 4: show 100% => inset(0 0 0 0)
  const clipInset = (4 - revealLevel) * 25; 
  const clipPathStyle = `inset(${clipInset}% 0 0 0)`;

  return (
    <div style={{
      maxWidth: '600px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px'
    }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} className="theme-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem' }}>
          <ArrowLeft size={14}/> 종료
        </button>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            <strong>{currentIndex + 1}</strong> / {TOTAL_QUESTIONS}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {score}점
          </div>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="glass-card" style={{
        padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        border: '1px solid var(--color-border)', borderRadius: '20px', backgroundColor: '#ffffff',
        boxShadow: 'var(--shadow-md)', position: 'relative'
      }}>
        
        {/* Reveal Phase & Timer Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{
            backgroundColor: '#f1f5f9', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
          }}>
            시야 {revealLevel}단계
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px', color: timeLeft <= 1 ? '#ef4444' : 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 'bold'
          }}>
            <Clock size={16}/> {timeLeft}초
          </div>
        </div>

        {/* Hanja Display Container */}
        <div style={{
          width: '240px', height: '240px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed var(--color-border)', overflow: 'hidden'
        }}>
          
          {/* Obscured Grid Overlay (Visual Hint of the 4 sections) */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none',
            display: 'flex', flexDirection: 'column'
          }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, borderBottom: i < 4 ? '1px dashed rgba(226,232,240,0.5)' : 'none' }} />
            ))}
          </div>

          {/* Actual Hanja Character with Clip Path */}
          <div style={{
            fontSize: '150px', fontWeight: 'bold', color: '#1e293b', fontFamily: '"AppleMyungjo", "Songti SC", "Songti TC", "Batang", serif',
            clipPath: clipPathStyle, transition: 'clip-path 0.5s ease-in-out', WebkitClipPath: clipPathStyle,
            lineHeight: 1, textShadow: '0px 4px 10px rgba(0,0,0,0.05)'
          }}>
            {target.char}
          </div>

          {/* Feedback Overlay */}
          {feedback && (
            <div style={{
              position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.9)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {feedback.type === 'correct' ? (
                <>
                  <div style={{ fontSize: '4rem', color: '#10b981', animation: 'bounce 0.5s' }}>⭕</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981', marginTop: '8px' }}>+{feedback.pts}점</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '4rem', color: '#ef4444', animation: 'shake 0.4s' }}>❌</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ef4444', marginTop: '8px' }}>오답 / 시간초과</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Options Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr', gap: '8px', width: '100%'
        }}>
          {currentOptions.map((opt, idx) => (
            <button
              key={idx}
              disabled={!!feedback}
              onClick={() => handleAnswer(opt)}
              style={{
                padding: '16px', borderRadius: '12px', border: '1.5px solid var(--color-border)', backgroundColor: '#ffffff',
                fontSize: '1.05rem', fontWeight: 'bold', color: '#1f2937', cursor: feedback ? 'default' : 'pointer',
                transition: 'all 0.15s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'center'
              }}
              onMouseEnter={(e) => { if(!feedback) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.03)'; } }}
              onMouseLeave={(e) => { if(!feedback) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.backgroundColor = '#ffffff'; } }}
            >
              {opt.meaning} <span style={{ color: 'var(--color-accent)' }}>{opt.sound}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
