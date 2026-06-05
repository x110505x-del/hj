import React, { useState, useEffect, useRef } from 'react';
import { Heart, Trophy, Zap, AlertTriangle, Shield, Sword, RefreshCw, Flame, CheckCircle, Volume2 } from 'lucide-react';
import { HANJA_DATA, updateAnswerStats } from '../services/mockDb';
import LearningCanvas from './LearningCanvas'; // we can embed a simplified canvas or a separate draw box

export default function QuizArena({ profile, onUpdateProfile, onNavigate }) {
  const levelData = HANJA_DATA[profile.currentLevel] || HANJA_DATA['8급'];
  
  const [arenaMode, setArenaMode] = useState('menu'); // 'menu' | 'adaptive' | 'boss' | 'timeattack' | 'gameover' | 'victory'
  
  // Game States
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [hearts, setHearts] = useState(5);
  const [score, setScore] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  
  // Boss Battle States
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [bossAnimation, setBossAnimation] = useState(''); // 'shake' | 'attack' | 'hurt' | ''
  const [combatLog, setCombatLog] = useState('');
  
  // Time Attack States
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  // Generate a random question
  const generateQuestion = () => {
    if (levelData.length < 2) return;
    
    // Choose a target Hanja
    const randomIndex = Math.floor(Math.random() * levelData.length);
    const target = levelData[randomIndex];
    
    // Select 3 random distractors from levelData
    const distractors = levelData
      .filter(item => item.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
      
    const allOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    
    // Pick question type
    // 0: Show Hanja, pick meaning/sound
    // 1: Sound cue, pick Hanja (Listening)
    const type = Math.random() > 0.5 ? 0 : 1;
    
    setCurrentQuestion({
      target,
      type,
      id: target.id
    });
    setOptions(allOptions);
    
    // Auto speak sound cues if listening type
    if (type === 1) {
      setTimeout(() => speakTargetSound(target), 300);
    }
  };

  const speakTargetSound = (target) => {
    if (!profile.soundOn || !('speechSynthesis' in window) || !target) return;
    window.speechSynthesis.cancel();
    const text = `${target.meaning} ${target.sound}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.pitch = profile.voice.startsWith('kids') ? 1.4 : 0.95;
    utterance.rate = profile.voice.startsWith('kids') ? 1.25 : 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleOptionSelect = (selectedOption) => {
    const isCorrect = selectedOption.id === currentQuestion.target.id;
    
    if (arenaMode === 'adaptive') {
      handleAdaptiveAnswer(isCorrect);
    } else if (arenaMode === 'boss') {
      handleBossAnswer(isCorrect);
    } else if (arenaMode === 'timeattack') {
      handleTimeAttackAnswer(isCorrect);
    }
  };

  // --- ADAPTIVE MODE ---
  const handleAdaptiveAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
      setConsecutiveCorrect(prev => prev + 1);
      
      // Update Database
      updateAnswerStats(currentQuestion.target.id, true, profile.currentLevel);
      const updated = {
        ...profile,
        xp: profile.xp + 10,
        gold: profile.gold + 5
      };
      onUpdateProfile(updated);
      
      if (profile.soundOn && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("정답!");
        u.rate = 1.6;
        window.speechSynthesis.speak(u);
      }
      
      generateQuestion();
    } else {
      setConsecutiveCorrect(0);
      const newHearts = hearts - 1;
      setHearts(newHearts);
      
      updateAnswerStats(currentQuestion.target.id, false, profile.currentLevel);
      const updated = {
        ...profile,
        hearts: Math.max(0, profile.hearts - 1)
      };
      onUpdateProfile(updated);

      if (profile.soundOn && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("땡");
        u.rate = 1.6;
        window.speechSynthesis.speak(u);
      }
      
      if (newHearts <= 0) {
        setArenaMode('gameover');
      } else {
        generateQuestion();
      }
    }
  };

  // --- BOSS BATTLE ---
  const handleBossAnswer = (isCorrect) => {
    if (isCorrect) {
      // Attack Boss
      setBossAnimation('hurt');
      setBossHp(prev => {
        const nextHp = Math.max(0, prev - 25);
        if (nextHp <= 0) {
          setTimeout(() => {
            setArenaMode('victory');
            // Complete boss award
            const updated = { ...profile, xp: profile.xp + 80, gold: profile.gold + 50 };
            onUpdateProfile(updated);
          }, 600);
        }
        return nextHp;
      });
      setCombatLog(`칼바람 베기! 보스에게 25의 피해를 입혔습니다! ⚔️`);
      
      if (profile.soundOn && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("공격 성공");
        u.rate = 1.5;
        window.speechSynthesis.speak(u);
      }

      setTimeout(() => {
        setBossAnimation('');
        generateQuestion();
      }, 700);
    } else {
      // Boss counter attacks
      setBossAnimation('attack');
      setPlayerHp(prev => {
        const nextHp = Math.max(0, prev - 25);
        if (nextHp <= 0) {
          setTimeout(() => setArenaMode('gameover'), 600);
        }
        return nextHp;
      });
      setCombatLog(`보스의 화염 방사! 25의 데미지를 입었습니다! 💥`);
      
      if (profile.soundOn && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("아이쿠");
        u.rate = 1.3;
        window.speechSynthesis.speak(u);
      }

      setTimeout(() => {
        setBossAnimation('');
        generateQuestion();
      }, 700);
    }
  };

  // --- TIME ATTACK ---
  const handleTimeAttackAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
      setTimeLeft(prev => prev + 2); // Gain 2 seconds
      
      if (profile.soundOn && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("앗싸");
        u.rate = 1.8;
        window.speechSynthesis.speak(u);
      }
      generateQuestion();
    } else {
      setTimeLeft(prev => Math.max(0, prev - 4)); // Lose 4 seconds
      if (profile.soundOn && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("어라");
        u.rate = 1.8;
        window.speechSynthesis.speak(u);
      }
      generateQuestion();
    }
  };

  // Time Attack countdown monitor
  useEffect(() => {
    if (arenaMode === 'timeattack') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setArenaMode('victory'); // Count it as success in terms of completion
            // Award score XP
            const updated = { ...profile, xp: profile.xp + score * 5, gold: profile.gold + score * 2 };
            onUpdateProfile(updated);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [arenaMode, score]);

  const startMode = (mode) => {
    setArenaMode(mode);
    setScore(0);
    setConsecutiveCorrect(0);
    setHearts(5);
    setBossHp(100);
    setPlayerHp(100);
    setCombatLog('');
    setTimeLeft(30);
    
    // Fetch fresh profile state to update local hearts if needed
    const fresh = { ...profile, hearts: 5 };
    onUpdateProfile(fresh);
    
    // Let's generate first question
    setTimeout(() => generateQuestion(), 100);
  };

  return (
    <div style={{ maxWidth: '650px', margin: '30px auto', width: '100%', padding: '0 20px' }}>
      
      {/* MENU SCREEN */}
      {arenaMode === 'menu' && (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <h2 className="font-display" style={{
            fontSize: profile.mode === 'kids' ? '2.4rem' : '1.8rem',
            color: 'var(--color-primary)',
            marginBottom: '10px'
          }}>
            ⚔️ 한자 무한 수련 퀴즈 아레나
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
            다양한 퀴즈 게임 모드를 통해 즐겁게 한자를 수습하고 복습하세요. 
            정답 시 대량의 경험치(XP)와 인게임 골드를 획득합니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Adaptive Quiz */}
            <div 
              onClick={() => startMode('adaptive')}
              style={{
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--border-radius-md)',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'var(--bg-card)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>🔄</div>
              <div>
                <h4 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>AI 무한 어댑티브 퀴즈</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  틀린 문항을 AI가 집요하게 재출제합니다. 생명(하트) 5개로 얼마나 오래 버틸지 도전해보세요!
                </p>
              </div>
            </div>

            {/* Boss Battle */}
            <div 
              onClick={() => startMode('boss')}
              style={{
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--border-radius-md)',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'var(--bg-card)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>👹</div>
              <div>
                <h4 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--color-accent-pink)' }}>한자 보스 격퇴 레이드</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  거대 한자 마왕 출현! 신속하고 정확하게 뜻을 맞추어 보스의 체력을 0으로 깎고 처단하세요!
                </p>
              </div>
            </div>

            {/* Time Attack */}
            <div 
              onClick={() => startMode('timeattack')}
              style={{
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--border-radius-md)',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'var(--bg-card)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>⏱️</div>
              <div>
                <h4 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--color-accent)' }}>30초 스피드 타임어택</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  남은 시간 30초! 맞추면 +2초, 틀리면 -4초! 당신의 순발력 한계를 돌파해보세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADAPTIVE IN GAME */}
      {arenaMode === 'adaptive' && currentQuestion && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>성공 횟수: {score}회</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart 
                  key={i} 
                  size={18} 
                  style={{
                    fill: i < hearts ? 'var(--color-heart)' : 'none',
                    stroke: i < hearts ? 'var(--color-heart)' : 'var(--color-text-muted)'
                  }} 
                />
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            {currentQuestion.type === 0 ? (
              // Char Question
              <div className="font-display" style={{ fontSize: '6rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                {currentQuestion.target.char}
              </div>
            ) : (
              // Listening Question
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => speakTargetSound(currentQuestion.target)}
                  style={{
                    padding: '20px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="anim-breathe"
                >
                  <Volume2 size={32} />
                </button>
                <div style={{ fontWeight: 'bold', color: 'var(--color-text-muted)' }}>스피커를 탭해 들리는 한자를 맞추세요!</div>
              </div>
            )}

            <h3 style={{ marginTop: '20px', fontSize: '1.25rem' }}>
              {currentQuestion.type === 0 ? '이 한자의 올바른 훈음은?' : '들려드린 한자 카드는 어떤 것일까요?'}
            </h3>
          </div>

          {/* Option Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {options.map(opt => (
              <button
                key={opt.id}
                className="theme-btn theme-btn-secondary"
                onClick={() => handleOptionSelect(opt)}
                style={{ padding: '16px', fontSize: '1.15rem', display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                {currentQuestion.type === 0 ? (
                  <span>{opt.meaning} {opt.sound}</span>
                ) : (
                  <span className="font-display" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{opt.char}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BOSS BATTLE SCREEN */}
      {arenaMode === 'boss' && currentQuestion && (
        <div className="glass-card" style={{ padding: '24px', overflow: 'hidden' }}>
          {/* Health gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Player HP */}
            <div>
              <div style={{ display: 'flex', justifySelf: 'start', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                <Shield size={14} style={{ color: 'var(--color-secondary)' }} />
                <span>나의 방어막: {playerHp}%</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ width: `${playerHp}%`, height: '100%', background: 'var(--color-secondary)', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            {/* Boss HP */}
            <div>
              <div style={{ display: 'flex', justifySelf: 'start', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-heart)' }}>
                <Sword size={14} />
                <span>한자 마왕 HP: {bossHp}%</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ width: `${bossHp}%`, height: '100%', background: 'var(--color-heart)', transition: 'width 0.3s' }}></div>
              </div>
            </div>
          </div>

          {/* Combat arena arena graphics */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            background: 'var(--bg-app)',
            padding: '20px',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--color-border)',
            marginBottom: '20px',
            minHeight: '160px',
            position: 'relative'
          }}>
            {/* Player Character */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem' }}>⚔️</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>용사 수련자</div>
            </div>

            {/* Combat Log middle */}
            {combatLog && (
              <div style={{
                position: 'absolute',
                top: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '50px',
                fontSize: '0.8rem',
                zIndex: 10
              }}>
                {combatLog}
              </div>
            )}

            {/* Boss Monster Graphic */}
            <div 
              style={{ 
                textAlign: 'center',
                transition: 'transform 0.2s',
                animation: bossAnimation === 'hurt' 
                  ? 'shake 0.4s infinite' 
                  : bossAnimation === 'attack' 
                    ? 'attack 0.4s ease' 
                    : 'float 3s infinite'
              }}
              className={bossAnimation === 'hurt' ? 'anim-shake' : ''}
            >
              <div style={{ 
                fontSize: '4.5rem', 
                filter: bossAnimation === 'hurt' ? 'hue-rotate(270deg) saturate(3)' : 'none' 
              }}>
                👹
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-heart)' }}>한자마왕 Stroke-King</div>
            </div>
          </div>

          {/* Question text */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>다음 한자의 뜻과 음을 신속히 선택해 공격하세요!</span>
            <div className="font-display" style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '6px' }}>
              {currentQuestion.target.char}
            </div>
          </div>

          {/* Option Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {options.map(opt => (
              <button
                key={opt.id}
                className="theme-btn theme-btn-secondary"
                onClick={() => handleOptionSelect(opt)}
                style={{ padding: '12px', fontSize: '1.05rem' }}
              >
                {opt.meaning} {opt.sound}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TIME ATTACK SCREEN */}
      {arenaMode === 'timeattack' && currentQuestion && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>성공 개수: {score}개</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: timeLeft <= 10 ? '#ef4444' : 'var(--color-text-main)'
            }}>
              <Zap size={18} fill="currentColor" className="anim-breathe" />
              <span>제한 시간: {timeLeft}초</span>
            </div>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ 
              width: `${(timeLeft/30)*100}%`, 
              height: '100%', 
              background: timeLeft <= 10 ? '#ef4444' : 'var(--color-accent)',
              transition: 'width 0.2s linear'
            }}></div>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div className="font-display" style={{ fontSize: '5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              {currentQuestion.target.char}
            </div>
            <h3 style={{ marginTop: '10px', fontSize: '1.1rem' }}>뜻과 음을 알맞게 탭하세요!</h3>
          </div>

          {/* Option Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {options.map(opt => (
              <button
                key={opt.id}
                className="theme-btn theme-btn-secondary"
                onClick={() => handleOptionSelect(opt)}
                style={{ padding: '14px', fontSize: '1.1rem' }}
              >
                {opt.meaning} {opt.sound}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {arenaMode === 'gameover' && (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>💀</div>
          <h2 className="font-display" style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '10px' }}>수련 실패 (Game Over)</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            체력이 고갈되었습니다. 역시 아직 수련이 조금 더 필요해 보이는군요. 
            배정한자 플래시 카드를 통해 눈과 귀로 다시 복습해 보시길 권장합니다.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="theme-btn theme-btn-primary" onClick={() => setArenaMode('menu')}>
              아레나 메뉴로 복귀
            </button>
            <button className="theme-btn theme-btn-secondary" onClick={() => onNavigate('dashboard')}>
              대시보드로 가기
            </button>
          </div>
        </div>
      )}

      {/* VICTORY SCREEN */}
      {arenaMode === 'victory' && (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🏆</div>
          <h2 className="font-display" style={{ fontSize: '2rem', color: 'var(--color-accent)', marginBottom: '10px' }}>수련 대성공! (Victory)</h2>
          
          <div style={{
            background: 'var(--bg-app)',
            padding: '16px',
            borderRadius: 'var(--border-radius-md)',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            {timeLeft === 0 ? (
              <p>⏱️ 타임어택 최종 성적: <strong>{score}개 성공!</strong></p>
            ) : (
              <p>👹 한자 보스 격퇴 공로로 아래의 보상이 획득되었습니다!</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px', fontWeight: 'bold' }}>
              <span style={{ color: 'var(--color-primary)' }}>+50 XP</span>
              <span style={{ color: 'var(--color-gold)' }}>+30 Gold</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="theme-btn theme-btn-primary" onClick={() => setArenaMode('menu')}>
              아레나 메뉴로 복귀
            </button>
            <button className="theme-btn theme-btn-secondary" onClick={() => onNavigate('dashboard')}>
              대시보드로 가기
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
