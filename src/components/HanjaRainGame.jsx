import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, Award, RefreshCw, Volume2, VolumeX, Flame, Trophy, Play } from 'lucide-react';
import { getHanjaByLevel } from '../services/hanjaDb';
import { speakKorean, cancelSpeech, unlockTtsAudio } from '../utils/tts';

export default function HanjaRainGame({ level, onBack, soundOn, onToggleSound }) {
  const allHanja = getHanjaByLevel(level);
  
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'gameover' | 'victory'
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [fallingHanja, setFallingHanja] = useState([]);
  const [bottomCards, setBottomCards] = useState([]);
  const [particles, setParticles] = useState([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highlightedId, setHighlightedId] = useState(null);
  const [clearedCount, setClearedCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  const audioCtxRef = useRef(null);
  const bgmIntervalRef = useRef(null);

  const gameAreaRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const nextHanjaId = useRef(0);
  const spawnQueueRef = useRef([]);
  const totalLevelCountRef = useRef(0);

  // BGM Logic: A highly intense heartbeat sequencer (using the same technique as the working tick sounds!)
  const playBgm = () => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      let beatCount = 0;

      const triggerBeat = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const currentCtx = audioCtxRef.current;
        const now = currentCtx.currentTime;

        // Double-beat heartbeat pattern: "lub-dub... lub-dub..."
        // First beat (lub)
        const osc1 = currentCtx.createOscillator();
        const gain1 = currentCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(currentCtx.destination);
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(65, now);
        osc1.frequency.exponentialRampToValueAtTime(0.01, now + 0.35);
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.start(now);
        osc1.stop(now + 0.36);

        // Second beat (dub) - slightly higher pitch, 280ms later
        const osc2 = currentCtx.createOscillator();
        const gain2 = currentCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(currentCtx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(75, now + 0.28);
        osc2.frequency.exponentialRampToValueAtTime(0.01, now + 0.28 + 0.35);
        gain2.gain.setValueAtTime(0.14, now + 0.28);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28 + 0.35);
        osc2.start(now + 0.28);
        osc2.stop(now + 0.28 + 0.36);

        // Every 4th beat, play a high tense pitch drone
        if (beatCount % 4 === 0) {
          const oscTense = currentCtx.createOscillator();
          const gainTense = currentCtx.createGain();
          oscTense.connect(gainTense);
          gainTense.connect(currentCtx.destination);
          oscTense.type = 'sine';
          oscTense.frequency.setValueAtTime(220, now); // A3
          gainTense.gain.setValueAtTime(0.012, now);
          gainTense.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          oscTense.start(now);
          oscTense.stop(now + 1.25);
        }

        beatCount++;
      };

      // Play first beat immediately
      triggerBeat();

      // Schedule subsequent beats every 1.5 seconds (representing an intense heart rate)
      bgmIntervalRef.current = setInterval(triggerBeat, 1500);
    } catch (e) {
      console.warn("BGM init failed:", e);
    }
  };

  const stopBgm = () => {
    if (bgmIntervalRef.current) {
      clearInterval(bgmIntervalRef.current);
      bgmIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(e=>e);
      audioCtxRef.current = null;
    }
  };

  // Initialize the game
  useEffect(() => {
    if (hasStarted) {
      startGame();
    }
    return () => {
      stopGameTimers();
      stopBgm();
    };
  }, [level, hasStarted]);

  // Main game loop (using requestAnimationFrame for smooth falling)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateGame = () => {
      // 1. Update falling character positions
      setFallingHanja((prev) => {
        let reachedBottomCount = 0;
        const updated = prev.map((item) => {
          const nextY = item.y + item.speed;
          if (nextY >= 82) { // 82% is the bottom floor limit
            reachedBottomCount++;
            return { ...item, y: nextY, hitFloor: true };
          }
          return { ...item, y: nextY };
        });

        // Filter out characters that hit the floor
        const remaining = updated.filter((item) => !item.hitFloor);

        // Check if level cleared (win condition)
        if (spawnQueueRef.current.length === 0 && remaining.length === 0) {
          setLives((currentLives) => {
            if (currentLives > 0) {
              setGameState('victory');
            }
            return currentLives;
          });
        }

        // Handle floor hits
        if (reachedBottomCount > 0) {
          setLives((prevLives) => {
            const nextLives = prevLives - reachedBottomCount;
            if (nextLives <= 0) {
              setGameState('gameover');
            }
            return Math.max(0, nextLives);
          });
          setCombo(0);
          playMissSound();
          return remaining;
        }

        return updated;
      });

      // 2. Update particle positions
      setParticles((prev) => 
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15, // gravity
          alpha: p.alpha - 0.02
        })).filter((p) => p.alpha > 0)
      );

      animationFrameRef.current = requestAnimationFrame(updateGame);
    };

    animationFrameRef.current = requestAnimationFrame(updateGame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, soundOn]);



  const startGame = () => {
    if (allHanja.length === 0) return;

    const shuffledHanja = [...allHanja].sort(() => 0.5 - Math.random());
    spawnQueueRef.current = [...shuffledHanja];
    totalLevelCountRef.current = shuffledHanja.length;

    // Pick 10 random Hanja to construct initial bottom cards
    const initialBottom = [...allHanja].sort(() => 0.5 - Math.random()).slice(0, 10);
    setBottomCards(initialBottom);

    setGameState('playing');
    setScore(0);
    setLives(3);
    setClearedCount(0);
    setFallingHanja([]);
    setParticles([]);
    setCombo(0);
    setMaxCombo(0);
    nextHanjaId.current = 0;

    // Set spawn intervals
    stopGameTimers();
    spawnHanja(); // Spawn first one immediately
    
    // Spawn a character every 3.0 seconds
    spawnTimerRef.current = setInterval(() => {
      spawnHanja();
    }, 3000);
  };

  const stopGameTimers = () => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const spawnHanja = () => {
    if (spawnQueueRef.current.length === 0) {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      return;
    }

    const randomCard = spawnQueueRef.current.shift();
    const randomX = 10 + Math.random() * 75;
    
    // Base speed, made more varied (0.05 to 0.16)
    const baseSpeed = 0.05 + Math.random() * 0.11;
    const speedMultiplier = 1 + (score / 250);
    let finalSpeed = Math.min(1.2, baseSpeed * speedMultiplier);

    // 한일(一), 두이(二), 석삼(三) 은 매우 쉬우므로 속도를 2배 빠르게 적용
    if (randomCard.char === '一' || randomCard.char === '二' || randomCard.char === '三') {
      finalSpeed *= 2.0;
    }

    const newFalling = {
      uid: nextHanjaId.current++,
      char: randomCard.char,
      meaning: randomCard.meaning,
      fullMeaning: randomCard.fullMeaning,
      sound: randomCard.sound,
      id: randomCard.id,
      x: randomX,
      y: 0,
      speed: finalSpeed
    };

    setFallingHanja((prev) => {
      const nextFalling = [...prev, newFalling];
      
      // Shuffle bottom cards immediately with the new falling Hanja!
      const activeIds = new Set(nextFalling.map(item => item.id));
      let newBottom = allHanja.filter(h => activeIds.has(h.id));
      const distractorPool = allHanja.filter(h => !activeIds.has(h.id));
      const needed = Math.max(0, 10 - newBottom.length);
      const distractors = distractorPool.sort(() => 0.5 - Math.random()).slice(0, needed);
      const combined = [...newBottom, ...distractors].sort(() => 0.5 - Math.random());
      setBottomCards(combined);

      return nextFalling;
    });
  };

  const createExplosion = (xPercent, yPercent, color) => {
    const newParticles = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      newParticles.push({
        id: Math.random(),
        x: xPercent,
        y: yPercent,
        vx: Math.cos(angle) * speed * 0.3,
        vy: Math.sin(angle) * speed * 0.3,
        alpha: 1.0,
        color: color || 'var(--color-primary)'
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const playMatchSound = () => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.warn("AudioContext failed", e);
    }
  };

  const playMissSound = () => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Miss sound failed", e);
    }
  };

  const handleCardClick = (card) => {
    if (gameState !== 'playing') return;

    const matchingItems = fallingHanja.filter((item) => item.id === card.id);

    if (matchingItems.length > 0) {
      playMatchSound();
      matchingItems.sort((a, b) => b.y - a.y);
      const target = matchingItems[0];

      setFallingHanja((prev) => {
        const remaining = prev.filter((item) => item.uid !== target.uid);
        
        // Check if level cleared
        if (spawnQueueRef.current.length === 0 && remaining.length === 0) {
          setGameState('victory');
        }
        return remaining;
      });

      setClearedCount((prev) => prev + 1);

      const addedScore = 15 + combo * 3;
      setScore((prev) => prev + addedScore);
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      createExplosion(target.x, target.y, 'var(--color-accent)');
    } else {
      setCombo(0);
      setHighlightedId(card.id);
      setTimeout(() => setHighlightedId(null), 300);
    }
  };

  if (!hasStarted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '680px',
        maxWidth: '850px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center',
        gap: '30px'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '12px', fontWeight: 'bold' }}>
            한자비 맞추기 게임
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            위에서 떨어지는 한자가 바닥에 닿기 전에 하단에서 올바른 뜻과 음을 찾아 클릭하세요!<br/>
            시작 버튼을 누르면 긴장감 넘치는 배경음악과 함께 게임이 즉시 시작됩니다.
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
            playBgm();
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
          <Play size={22} fill="currentColor" /> 게임 시작하기
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

  return (
    <div style={{
      maxWidth: '850px',
      width: '100%',
      minHeight: '680px',
      margin: '0 auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxSizing: 'border-box'
    }}>
      
      {/* Top Header Row */}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '30px' }}>
          {/* Hearts Display */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                size={20} 
                fill={i < lives ? '#ef4444' : 'none'} 
                color={i < lives ? '#ef4444' : '#d1d5db'} 
                style={{ transition: 'transform 0.2s' }}
              />
            ))}
          </div>

          {/* Combo Indicator */}
          <div style={{ visibility: combo > 0 ? 'visible' : 'hidden', minWidth: '50px', display: 'inline-block' }}>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              🔥 {combo}
            </span>
          </div>

          {/* Progress and Score */}
          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
            진행: <strong style={{ color: 'var(--color-accent)' }}>{clearedCount}/{totalLevelCountRef.current}</strong>
          </span>

          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
            점수: <strong style={{ color: 'var(--color-primary)' }}>{score}</strong>
          </span>
        </div>
      </div>

      {/* Game Falling Board Canvas wrapper */}
      <div 
        ref={gameAreaRef}
        style={{
          width: '100%',
          height: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '2px solid var(--color-border)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-inner)',
          boxSizing: 'border-box'
        }}
      >
        {gameState === 'playing' ? (
          <>
            <style>{`
              @keyframes danger-blink {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.25; transform: translate(-50%, -50%) scale(1.15); }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              }
            `}</style>

            {/* Falling Hanja Elements */}
            {fallingHanja.map((item) => {
              const isNearBottom = item.y >= 55;
              return (
                <div
                  key={item.uid}
                  style={{
                    position: 'absolute',
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: '2.8rem',
                    fontWeight: 'bold',
                    fontFamily: 'serif',
                    color: isNearBottom ? '#ef4444' : 'var(--color-primary)',
                    textShadow: isNearBottom 
                      ? '0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.4)' 
                      : '0 2px 6px rgba(16, 185, 129, 0.15)',
                    pointerEvents: 'none',
                    animation: isNearBottom ? 'danger-blink 0.35s infinite alternate ease-in-out' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {item.char}
                </div>
              );
            })}

            {/* Explosion Particles */}
            {particles.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  opacity: p.alpha,
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}

            {/* Danger Zone Bottom Red line */}
            <div style={{
              position: 'absolute',
              bottom: '18%',
              left: 0,
              width: '100%',
              height: '2px',
              borderTop: '2px dashed rgba(239, 68, 68, 0.3)',
              pointerEvents: 'none'
            }} />
          </>
        ) : gameState === 'victory' ? (
          /* Victory Screen */
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            textAlign: 'center',
            padding: '24px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <Trophy size={48} />
            </div>

            <div>
              <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)', margin: '0 0 6px 0', fontWeight: 'bold' }}>
                미션 성공!
              </h2>
              <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                {level} 배정한자 전체를 완벽히 마스터했습니다!
              </span>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '16px 32px',
              display: 'flex',
              gap: '32px'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>최종 점수</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{score}점</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--color-border)' }} />
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>최대 콤보</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>🔥 {maxCombo}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '300px' }}>
              <button onClick={onBack} className="theme-btn" style={{
                flex: 1,
                padding: '12px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                목록으로
              </button>
              <button onClick={startGame} className="theme-btn theme-btn-primary" style={{
                flex: 1,
                padding: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                <RefreshCw size={14} style={{ marginRight: '4px' }} /> 다시하기
              </button>
            </div>
          </div>
        ) : (
          /* Game Over Screen */
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            textAlign: 'center',
            padding: '24px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <Award size={36} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#ef4444', margin: '0 0 4px 0', fontWeight: 'bold' }}>
                게임 종료!
              </h2>
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
                한자가 바닥에 모두 도달했습니다.
              </span>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '12px 24px',
              display: 'flex',
              gap: '24px'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>최종 점수</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{score}점</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--color-border)' }} />
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>최대 콤보</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>🔥 {maxCombo}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '300px' }}>
              <button onClick={onBack} className="theme-btn" style={{
                flex: 1,
                padding: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                목록으로
              </button>
              <button onClick={startGame} className="theme-btn theme-btn-primary" style={{
                flex: 1,
                padding: '10px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                <RefreshCw size={14} style={{ marginRight: '4px' }} /> 다시하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Option Grid: 10 dynamic cards */}
      <div className="rain-game-bottom-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        padding: '4px 0',
        height: '96px',
        boxSizing: 'border-box'
      }}>
        {bottomCards.map((card) => {
          const isHighlighted = highlightedId === card.id;

          return (
            <button
              key={card.id}
              disabled={gameState !== 'playing'}
              onClick={() => handleCardClick(card)}
              className="rain-game-bottom-card"
              style={{
                padding: '10px 4px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                backgroundColor: isHighlighted ? '#fca5a5' : '#ffffff',
                border: isHighlighted ? '2px solid #ef4444' : '2px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'all 0.15s ease',
                animation: isHighlighted ? 'shake 0.2s ease-in-out' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
              title={card.fullMeaning}
            >
              <span style={{ color: '#1f2937' }}>{card.meaning}</span>
              <span style={{ color: 'var(--color-accent)' }}>{card.sound}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
