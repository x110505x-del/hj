import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Award, Flame, RefreshCw, Volume2, VolumeX, HelpCircle, Play } from 'lucide-react';
import { getHanjaByLevel } from '../services/hanjaDb';
import { speakKorean, unlockTtsAudio } from '../utils/tts';
import { addStudyLog, addWrongHanja } from '../services/mockDb';

export default function SpeedQuiz({ level, onBack, soundOn, onToggleSound, onCompleteGame }) {
  const TIME_LIMIT = 5; // 5 seconds per question
  
  const allHanjaForLevel = getHanjaByLevel(level, false);
  
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'result'
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef(null);
  const speechRef = useRef(null);
  const lastTickedSecondRef = useRef(6);

  const playTickSound = () => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.warn("AudioContext failed", e);
    }
  };

  const playCorrectSound = () => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Pleasant double-tone chime (C5 to E5)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn("Correct sound failed", e);
    }
  };

  const playIncorrectSound = () => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Low descending buzz
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Incorrect sound failed", e);
    }
  };

  // Initialize questions
  useEffect(() => {
    if (hasStarted) {
      startQuiz();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [level, hasStarted]);

  // Handle countdown timer
  useEffect(() => {
    if (!hasStarted || gameState !== 'playing' || isAnswered) return;

    if (timeLeft <= 0) {
      playIncorrectSound();
      handleAnswer(null); // Time out counts as incorrect
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const nextVal = prev - 0.1;
        const currentSec = Math.ceil(nextVal);
        if (currentSec >= 1 && currentSec < lastTickedSecondRef.current) {
          playTickSound();
          lastTickedSecondRef.current = currentSec;
        }
        return nextVal;
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, gameState, isAnswered, hasStarted]);

  // Report rewards on completion
  useEffect(() => {
    if (gameState === 'result') {
      const g = correctCount * 2;
      const x = correctCount * 5;
      
      // Save study history log
      addStudyLog(
        '스피드 퀴즈',
        `${level} 수련 완료 (정답: ${correctCount}개, 오답: ${incorrectCount}개)`,
        g,
        x
      );

      if (onCompleteGame) {
        // 기준양: 최소 5문제 이상 정답이어야 출석(수련완료) 인정
        const isSuccess = correctCount >= 5;
        onCompleteGame(g, x, isSuccess);
      }
    }
  }, [gameState]);

  const startQuiz = () => {
    if (allHanjaForLevel.length === 0) return;

    // Determine target question count: 50 if database has > 50, otherwise 30 to allow a random subset
    const questionCount = allHanjaForLevel.length > 50 ? 50 : Math.min(30, allHanjaForLevel.length);

    // Shuffle and slice to target question count
    const selectedQuestions = [...allHanjaForLevel]
      .sort(() => 0.5 - Math.random())
      .slice(0, questionCount);
    
    setQuestions(selectedQuestions);
    setCurrentQIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setGameState('playing');
    loadQuestion(0, selectedQuestions);
  };

  const loadQuestion = (index, questionList = questions) => {
    if (index >= questionList.length) {
      setGameState('result');
      return;
    }

    const currentHanja = questionList[index];
    setSelectedOptionId(null);
    setIsAnswered(false);
    setTimeLeft(TIME_LIMIT);
    lastTickedSecondRef.current = 6; // Reset tick tracking for the new question

    // Generate 5 options (1 correct, 4 incorrect)
    const correctOption = currentHanja;
    
    // Get incorrect pool (excluding current Hanja) from the current level's Hanja (non-cumulative)
    // If the current level's pool is too small (e.g. less than 10), fall back to 4급 pool
    const incorrectPool = allHanjaForLevel.length >= 10 ? allHanjaForLevel : getHanjaByLevel('4급');
    const incorrectCandidates = incorrectPool.filter(h => h.id !== currentHanja.id);
    
    const shuffledIncorrect = incorrectCandidates.sort(() => 0.5 - Math.random()).slice(0, 4);
    const combinedOptions = [correctOption, ...shuffledIncorrect].sort(() => 0.5 - Math.random());

    setOptions(combinedOptions);
  };

  const handleAnswer = (optionId) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOptionId(optionId);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentHanja = questions[currentQIndex];
    const isCorrect = optionId === currentHanja.id;

    if (isCorrect) {
      const addedScore = 10 + combo * 2;
      setScore((prev) => prev + addedScore);
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      setCorrectCount((prev) => prev + 1);
      
      playCorrectSound();
    } else {
      setCombo(0);
      setIncorrectCount((prev) => prev + 1);
      
      // Record to incorrect notes
      addWrongHanja({
        ...currentHanja,
        level: level
      });
      
      playIncorrectSound();
    }

    // Go to next question after a delay
    setTimeout(() => {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      loadQuestion(nextIndex);
    }, 1200);
  };

  if (allHanjaForLevel.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
        한자 데이터가 부족합니다.
      </div>
    );
  }

  if (gameState === 'result') {
    const totalQ = correctCount + incorrectCount;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

    return (
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        border: '2px solid var(--color-border)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '85px',
            height: '85px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            boxSizing: 'border-box',
            padding: '6px',
            border: '2px solid rgba(16, 185, 129, 0.2)'
          }}>
            <Award size={20} style={{ marginBottom: '2px' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{accuracy}% 정답</span>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary)', margin: '0 0 8px 0', fontWeight: 'bold' }}>
            스피드 퀴즈 결과
          </h2>
          <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>{level} 테스트 결과입니다.</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          background: 'rgba(16, 185, 129, 0.03)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>최종 점수</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{score}점</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>최대 콤보</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
              🔥 {maxCombo}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingOver: '8px', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-around', paddingTop: '10px' }}>
            <div>
              <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>맞춤: {correctCount}</span>
            </div>
            <div>
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>틀림: {incorrectCount}</span>
            </div>
          </div>
        </div>

        {accuracy >= 90 ? (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1.5px dashed var(--color-primary)',
            borderRadius: '10px',
            padding: '12px 14px',
            color: 'var(--color-primary)',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            🎉 90%이상 정답률을 보이네요! 급수를 올려서 도전해 보세요!
          </div>
        ) : (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1.5px dashed #f59e0b',
            borderRadius: '10px',
            padding: '12px 14px',
            color: '#d97706',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            💪 90% 미만의 정답률인데, 다시한번 도전해 볼까요?
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onBack} className="theme-btn" style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            color: 'var(--color-primary)',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}>
            <ArrowLeft size={14} style={{ marginRight: '6px' }} /> 목록으로
          </button>
          
          <button onClick={startQuiz} className="theme-btn theme-btn-primary" style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> 다시 하기
          </button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '650px',
        maxWidth: '750px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center',
        gap: '30px',
        boxSizing: 'border-box'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '12px', fontWeight: 'bold' }}>
            스피드 퀴즈
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            한자를 보고 알맞은 뜻과 음을 제한시간 5초 내에 선택하세요!<br/>
            시작 버튼을 누르면 퀴즈가 즉시 시작됩니다.
          </p>
        </div>
        
        <button 
          onClick={() => {
            if (typeof window !== 'undefined') {
              if ('speechSynthesis' in window) {
                const u = new SpeechSynthesisUtterance('');
                u.volume = 0;
                window.speechSynthesis.speak(u);
              }
              unlockTtsAudio();
            }
            setHasStarted(true);
          }}
          className="theme-btn theme-btn-primary" 
          style={{
            fontSize: '1.3rem',
            padding: '16px 40px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold'
          }}
        >
          <Play size={22} fill="currentColor" /> 퀴즈 시작하기
        </button>

        {/* TTS/Sound Toggle Button on Start Screen */}
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={onToggleSound}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid var(--color-border)',
              backgroundColor: '#ffffff',
              color: 'var(--color-text-muted)',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              margin: '0 auto'
            }}
          >
            {soundOn ? (
              <>
                <Volume2 size={16} style={{ color: 'var(--color-primary)' }} />
                <span>TTS 효과음 켜짐</span>
              </>
            ) : (
              <>
                <VolumeX size={16} style={{ color: '#ef4444' }} />
                <span>TTS 효과음 꺼짐 (음소거)</span>
              </>
            )}
          </button>
        </div>

        <button onClick={onBack} className="theme-btn" style={{ marginTop: '15px', fontSize: '0.95rem' }}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const currentHanja = questions[currentQIndex];

  return (
    <div style={{
      maxWidth: '750px',
      width: '100%',
      minHeight: '650px',
      margin: '0 auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      boxSizing: 'border-box'
    }}>
      
      {/* Quiz Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} className="theme-btn" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--color-primary)',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          <ArrowLeft size={16} /> 나가기
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '30px' }}>
          <div style={{ visibility: combo > 0 ? 'visible' : 'hidden', minWidth: '85px', display: 'inline-block' }}>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Flame size={14} fill="currentColor" /> {combo} 콤보
            </span>
          </div>
          <span style={{ fontWeight: 'bold', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            점수: <strong style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>{score}</strong>
          </span>
        </div>
      </div>

      {/* Progress & Timer bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <span>문제 {currentQIndex + 1} / {questions.length}</span>
          <span style={{ color: timeLeft <= 1.5 ? '#ef4444' : 'var(--color-primary)', fontWeight: 'bold' }}>
            남은 시간: {Math.max(0, timeLeft).toFixed(1)}초
          </span>
        </div>
        
        {/* Outer timer track */}
        <div style={{
          height: '6px',
          width: '100%',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          {/* Inner timer fill */}
          <div style={{
            height: '100%',
            width: `${(timeLeft / TIME_LIMIT) * 100}%`,
            backgroundColor: timeLeft <= 1.5 ? '#ef4444' : 'var(--color-primary)',
            transition: 'width 0.1s linear'
          }}></div>
        </div>
      </div>

      {/* Question Card Display */}
      {currentHanja && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '2px solid var(--color-border)',
          padding: '24px 20px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          height: '220px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          <span style={{
            fontSize: '8.5rem',
            fontFamily: 'serif',
            color: 'var(--color-primary)',
            display: 'block',
            lineHeight: 1
          }}>
            {currentHanja.char}
          </span>
          <span style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            position: 'absolute',
            bottom: '12px',
            left: '0',
            right: '0'
          }}>
            위 한자의 올바른 뜻과 음을 고르세요
          </span>
        </div>
      )}

      {/* Choice Options List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '10px'
      }}>
        {options.map((opt, idx) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrectChoice = opt.id === currentHanja?.id;
          
          let buttonBg = '#ffffff';
          let buttonBorder = 'var(--color-border)';
          let textColor = 'var(--color-primary)';

          if (isAnswered) {
            if (isCorrectChoice) {
              buttonBg = 'rgba(16, 185, 129, 0.12)';
              buttonBorder = 'var(--color-primary)';
              textColor = 'var(--color-primary)';
            } else if (isSelected) {
              buttonBg = 'rgba(239, 68, 68, 0.12)';
              buttonBorder = '#ef4444';
              textColor = '#ef4444';
            } else {
              buttonBg = '#f9fafb';
              textColor = 'var(--color-text-muted)';
              buttonBorder = 'rgba(0,0,0,0.05)';
            }
          }

          return (
            <button
              key={opt.id + '_' + idx}
              disabled={isAnswered}
              onClick={() => handleAnswer(opt.id)}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: `2px solid ${buttonBorder}`,
                backgroundColor: buttonBg,
                color: textColor,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: isAnswered ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span>{idx + 1}. {opt.fullMeaning}</span>
              {isAnswered && isCorrectChoice && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>✔ 정답</span>
              )}
              {isAnswered && isSelected && !isCorrectChoice && (
                <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>❌ 오답</span>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
