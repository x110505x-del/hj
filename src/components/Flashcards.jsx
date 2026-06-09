import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ArrowLeft, RefreshCw, Play, Pause, Award } from 'lucide-react';
import { getHanjaByLevel, HANJA_RAW_DATA } from '../services/hanjaDb';
import { speakKorean, cancelSpeech, unlockTtsAudio, preloadKoreanSpeech } from '../utils/tts';

export default function Flashcards({ level, onBack, soundOn, onToggleSound, onStudyCard }) {
  const [shuffledList, setShuffledList] = useState([]);
  const [learningPhase, setLearningPhase] = useState('start'); // 'start' | 'learn' | 'transition' | 'review' | 'complete'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false); // For review/test phase

  const currentHanja = shuffledList[currentIndex];

  const timer1Ref = useRef(null);
  const timerNextRef = useRef(null);
  const isSequenceCancelledRef = useRef(false);
  const currentIndexRef = useRef(currentIndex);

  // Keep currentIndexRef updated to prevent stale card race conditions
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Track study progress when card changes
  useEffect(() => {
    if (learningPhase === 'learn' || learningPhase === 'review') {
      if (onStudyCard) {
        onStudyCard();
      }
    }
  }, [currentIndex, learningPhase]);

  const clearAllTimers = () => {
    if (timer1Ref.current) clearTimeout(timer1Ref.current);
    if (timerNextRef.current) clearTimeout(timerNextRef.current);
    timer1Ref.current = null;
    timerNextRef.current = null;
  };

  const playCardSequence = (index, immediate = false) => {
    clearAllTimers();
    cancelSpeech();
    isSequenceCancelledRef.current = false;

    const targetHanja = shuffledList[index];
    if (!targetHanja) return;

    // Use comma separation to insert a natural breath pause between meaning and sound
    const text = `${targetHanja.meaning}, ${targetHanja.sound}`;

    const run = () => {
      if (index !== currentIndexRef.current || isSequenceCancelledRef.current || isPaused) return;
      if (!soundOn) {
        // If sound is off, wait 2.2 seconds and advance to simulate card timing
        timerNextRef.current = setTimeout(() => {
          if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
            advanceLearnCard();
          }
        }, 2200);
        return;
      }

      speakKorean(text, {
        gender: 'female',
        rate: 0.95,
        repeatTwice: true, // Learn mode repeats twice
        skipCancel: immediate === true,
        onEnd: () => {
          if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
            // Wait 1.8 seconds (1800ms) after speech ends before advancing to the next card to prevent cutoff
            timerNextRef.current = setTimeout(() => {
              if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
                advanceLearnCard();
              }
            }, 1800);
          }
        },
        onError: (err) => {
          console.error("Flashcards: TTS speech execution error:", err);
          if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
            timerNextRef.current = setTimeout(() => {
              if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
                advanceLearnCard();
              }
            }, 1800);
          }
        }
      });
    };

    if (immediate) {
      run();
    } else {
      timer1Ref.current = setTimeout(run, 200);
    }
  };

  const playReviewSequence = (index) => {
    clearAllTimers();
    cancelSpeech();
    isSequenceCancelledRef.current = false;
    setShowAnswer(false); // Hide answer initially

    const targetHanja = shuffledList[index];
    if (!targetHanja) return;

    // Use comma separation to insert a natural breath pause between meaning and sound
    const text = `${targetHanja.meaning}, ${targetHanja.sound}`;

    // Wait 3 seconds for user to guess the meaning and sound
    timer1Ref.current = setTimeout(() => {
      if (index !== currentIndexRef.current || isSequenceCancelledRef.current || isPaused) return;

      setShowAnswer(true);

      if (!soundOn) {
        // If sound is off, wait 1.5 seconds and advance
        timerNextRef.current = setTimeout(() => {
          if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
            advanceReviewCard();
          }
        }, 1500);
        return;
      }

      speakKorean(text, {
        gender: 'female',
        rate: 0.95,
        repeatTwice: true, // Review mode reads twice!
        onEnd: () => {
          if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
            // Wait 1.8 seconds before advancing to prevent audio tail cutoff
            timerNextRef.current = setTimeout(() => {
              if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
                advanceReviewCard();
              }
            }, 1800);
          }
        },
        onError: (err) => {
          console.error("Flashcards Review: TTS speech execution error:", err);
          if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
            timerNextRef.current = setTimeout(() => {
              if (index === currentIndexRef.current && !isSequenceCancelledRef.current && !isPaused) {
                advanceReviewCard();
              }
            }, 1800);
          }
        }
      });
    }, 3000);
  };

  const advanceLearnCard = () => {
    if (currentIndexRef.current < shuffledList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop finished -> transition screen for the second loop (review/test)
      setLearningPhase('transition');
      setCurrentIndex(0);
      setIsPaused(false);
    }
  };

  const advanceReviewCard = () => {
    if (currentIndexRef.current < shuffledList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Review loop finished -> complete screen
      setLearningPhase('complete');
    }
  };

  const playTts = (e) => {
    if (e) e.stopPropagation();
    if (!currentHanja) return;
    
    // In review mode, clicking the card immediately reveals the answer and speaks it
    if (learningPhase === 'review') {
      setShowAnswer(true);
      clearAllTimers();
      speakKorean(`${currentHanja.meaning}, ${currentHanja.sound}`, {
        gender: 'female',
        rate: 0.95,
        repeatTwice: false,
        skipCancel: true
      });
      return;
    }

    speakKorean(`${currentHanja.meaning}, ${currentHanja.sound}`, {
      gender: 'female',
      rate: 0.95,
      repeatTwice: true,
      skipCancel: true
    });
  };

  // Load Hanja List
  useEffect(() => {
    const rawList = level === '8급' 
      ? getHanjaByLevel('8급') 
      : (HANJA_RAW_DATA[level] || []);

    const shuffled = [...rawList].sort(() => 0.5 - Math.random());
    setShuffledList(shuffled);
    setCurrentIndex(0);
    setLearningPhase('start');
    setIsPaused(false);
  }, [level]);

  // Preload upcoming card audios to avoid lag
  useEffect(() => {
    if (shuffledList.length === 0) return;
    
    const indicesToPreload = [
      currentIndex,
      (currentIndex + 1) % shuffledList.length,
      (currentIndex + 2) % shuffledList.length
    ];
    
    indicesToPreload.forEach(idx => {
      const hanja = shuffledList[idx];
      if (hanja) {
        const text = `${hanja.meaning} ${hanja.sound}`;
        const cleaned = text.replace(/[.,]/g, '').trim();
        const repeatedText = `${cleaned}, ${cleaned}.`;
        preloadKoreanSpeech(repeatedText);
      }
    });
  }, [currentIndex, shuffledList]);

  // Main automatic practice / speaking sequence loop
  useEffect(() => {
    if (shuffledList.length === 0 || learningPhase === 'start' || learningPhase === 'transition' || learningPhase === 'complete') return;

    if (isPaused) {
      isSequenceCancelledRef.current = true;
      clearAllTimers();
      cancelSpeech();
      return;
    }

    if (learningPhase === 'learn') {
      playCardSequence(currentIndex, false);
    } else if (learningPhase === 'review') {
      playReviewSequence(currentIndex);
    }

    return () => {
      isSequenceCancelledRef.current = true;
      clearAllTimers();
      cancelSpeech();
    };
  }, [currentIndex, shuffledList, soundOn, isPaused, learningPhase]);

  if (shuffledList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
        등록된 한자가 없습니다.
        <button onClick={onBack} className="theme-btn theme-btn-primary" style={{ marginTop: '20px' }}>
          돌아가기
        </button>
      </div>
    );
  }

  if (learningPhase === 'start') {
    return (
      <div className="flashcards-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '680px',
        maxWidth: '750px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center',
        gap: '30px'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '12px', fontWeight: 'bold' }}>
            플래쉬 카드 연습
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            한자의 뜻과 음을 자동으로 소리 내어 들려주는 <strong>학습하기</strong> 모드와,<br/>
            한자만 먼저 보고 뜻과 음을 직접 맞추며 복습하는 <strong>한자 맞추기</strong> 모드 중 선택해 주세요.
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '550px',
          margin: '0 auto'
        }}>
          {/* 학습하기 (듣고 보기) */}
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                unlockTtsAudio();
              }
              setLearningPhase('learn');
              setCurrentIndex(0);
            }}
            className="theme-btn theme-btn-primary" 
            style={{
              flex: '1 1 200px',
              fontSize: '1.15rem',
              padding: '16px 24px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 'bold'
            }}
          >
            <Play size={20} fill="currentColor" /> 학습하기 (듣고 보기)
          </button>

          {/* 한자 맞추기 (테스트) */}
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                unlockTtsAudio();
              }
              setLearningPhase('review');
              setCurrentIndex(0);
              setShowAnswer(false);
            }}
            className="theme-btn" 
            style={{
              flex: '1 1 200px',
              fontSize: '1.15rem',
              padding: '16px 24px',
              borderRadius: '16px',
              border: '2px solid var(--color-primary)',
              color: 'var(--color-primary)',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 'bold'
            }}
          >
            <Award size={20} /> 한자 맞추기 (테스트)
          </button>
        </div>

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

  // transition screen (Phase 3)
  if (learningPhase === 'transition') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '680px',
        maxWidth: '750px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center',
        gap: '30px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '2px solid var(--color-primary)',
          padding: '45px 30px',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '550px',
          boxSizing: 'border-box'
        }}>
          <Award size={64} style={{ color: 'var(--color-primary)', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: '20px', fontWeight: 'bold' }}>
            1차 배정한자 학습 완료!
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#111827', fontWeight: 'bold', lineHeight: '1.6', marginBottom: '16px' }}>
            "두번째 반복될때는 한자를 보고 뜻과 음을 맞춰보세요!"
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '30px' }}>
            시작 버튼을 누르면 한자만 3초간 먼저 보여드립니다.<br/>
            스스로 뜻과 음을 생각해보신 후, 복습용 정답 소리를 들어보세요.
          </p>
          
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                unlockTtsAudio();
              }
              setLearningPhase('review');
              setCurrentIndex(0);
              setShowAnswer(false);
            }}
            className="theme-btn theme-btn-primary" 
            style={{
              fontSize: '1.25rem',
              padding: '14px 40px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-md)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            <Play size={20} fill="currentColor" /> 시작
          </button>
        </div>
      </div>
    );
  }

  // complete screen (Phase 5)
  if (learningPhase === 'complete') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '680px',
        maxWidth: '750px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center',
        gap: '30px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '2px solid var(--color-primary)',
          padding: '45px 30px',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '550px',
          boxSizing: 'border-box'
        }}>
          <Award size={64} style={{ color: 'var(--color-accent)', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary)', marginBottom: '16px', fontWeight: 'bold' }}>
            학습 및 복습 완료! 🎉
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#1f2937', lineHeight: '1.6', marginBottom: '30px' }}>
            {level} 배정한자의 학습과 복습 테스트를 모두 마쳤습니다.<br/>
            반복적으로 학습하면 한자 실력이 더욱 자라납니다.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                setLearningPhase('start');
                setCurrentIndex(0);
                setIsPaused(false);
              }}
              className="theme-btn theme-btn-primary"
              style={{
                fontSize: '1rem',
                padding: '12px 24px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={18} /> 처음부터 다시하기
            </button>
            <button 
              onClick={onBack} 
              className="theme-btn"
              style={{
                fontSize: '1rem',
                padding: '12px 24px',
                borderRadius: '10px'
              }}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (learningPhase === 'learn') {
      advanceLearnCard();
    } else if (learningPhase === 'review') {
      advanceReviewCard();
    }
  };

  const handlePrev = () => {
    if (learningPhase === 'learn') {
      setCurrentIndex((prev) => (prev - 1 + shuffledList.length) % shuffledList.length);
    } else if (learningPhase === 'review') {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="flashcards-container" style={{
      maxWidth: '750px',
      width: '100%',
      minHeight: '680px',
      margin: '0 auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Styles for Countdown Bar & Pulsing Text */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      {/* Header Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center'
      }}>
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
          <ArrowLeft size={16} /> 홈으로
        </button>
        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
          {learningPhase === 'review' ? `${level} 복습 테스트` : `${level} 연습`} ({currentIndex + 1} / {shuffledList.length})
        </span>
      </div>

      {/* Card Section */}
      <div 
        onClick={playTts}
        style={{
          width: '100%',
          height: '440px',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '30px',
          boxSizing: 'border-box',
          textAlign: 'center',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <span style={{
              fontSize: 'clamp(5.5rem, 18vw, 11rem)',
              color: '#1f2937',
              fontWeight: 'bold',
              fontFamily: '"AppleMyungjo", "Songti SC", "Songti TC", "Batang", serif'
            }}>{currentHanja ? currentHanja.char : ''}</span>
          </div>

          {learningPhase === 'learn' ? (
            <div style={{ marginTop: '10px' }}>
              <h2 style={{
                fontSize: 'clamp(1.8rem, 6.5vw, 3rem)',
                color: 'var(--color-primary)',
                margin: 0,
                fontWeight: 'bold'
              }}>
                {currentHanja ? currentHanja.meaning : ''} <span style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', color: 'var(--color-accent)' }}>{currentHanja ? currentHanja.sound : ''}</span>
              </h2>
            </div>
          ) : (
            /* Review Phase Card View */
            <div style={{ marginTop: '10px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!showAnswer ? (
                <span style={{ fontSize: '1.7rem', color: '#9ca3af', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                  뜻과 음을 맞춰보세요...
                </span>
              ) : (
                <h2 style={{
                  fontSize: 'clamp(1.8rem, 6.5vw, 3rem)',
                  color: 'var(--color-primary)',
                  margin: 0,
                  fontWeight: 'bold'
                }}>
                  {currentHanja ? currentHanja.meaning : ''} <span style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', color: 'var(--color-accent)' }}>{currentHanja ? currentHanja.sound : ''}</span>
                </h2>
              )}
            </div>
          )}

          {/* Countdown Indicator Bar in Review mode */}
          {learningPhase === 'review' && !showAnswer && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '6px',
              backgroundColor: 'var(--color-accent)',
              width: '100%',
              animation: isPaused ? 'none' : 'shrink 3s linear forwards'
            }} />
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        width: '100%',
        justifyContent: 'center'
      }}>
        <button 
          onClick={handlePrev} 
          disabled={learningPhase === 'review' && currentIndex === 0}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--color-primary)',
            opacity: (learningPhase === 'review' && currentIndex === 0) ? 0.4 : 1
          }}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Central Play/Pause slideshow controller */}
        <button 
          onClick={() => setIsPaused(prev => !prev)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '2px solid var(--color-primary)',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            color: '#ffffff',
            transition: 'all 0.2s'
          }}
          title={isPaused ? "슬라이드 재생" : "슬라이드 일시정지"}
        >
          {isPaused ? <Play size={26} fill="currentColor" /> : <Pause size={26} fill="currentColor" />}
        </button>

        <button 
          onClick={handleNext}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--color-primary)'
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

    </div>
  );
}
