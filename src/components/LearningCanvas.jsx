import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Play, Volume2, Info, ChevronLeft, ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { HANJA_DATA, updateAnswerStats } from '../services/mockDb';
import { speakKorean, cancelSpeech, unlockTtsAudio } from '../utils/tts';

export default function LearningCanvas({ profile, onUpdateProfile, onNavigate }) {
  const levelData = HANJA_DATA[profile.currentLevel] || HANJA_DATA['8급'];
  const [selectedHanjaIndex, setSelectedHanjaIndex] = useState(0);
  const currentHanja = levelData[selectedHanjaIndex];

  const [traceGuide, setTraceGuide] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' }); // 'success', 'error', 'info', ''
  const [strokeOrderAnimActive, setStrokeOrderAnimActive] = useState(false);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0); // Which stroke the user is expected to draw next
  
  const canvasRef = useRef(null);
  const animCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]); // Points in the current stroke

  const canvasSize = 300; // Fixed canvas size for calculations

  // Synthesize pronunciation
  const speakCurrent = () => {
    if (!profile.soundOn || !currentHanja) return;
    cancelSpeech();
    const text = `${currentHanja.meaning}, ${currentHanja.sound}`;
    speakKorean(text, {
      voiceType: profile.voice.startsWith('kids') ? 'child' : 'female',
      rate: profile.voice.startsWith('kids') ? 1.15 : 0.95,
      repeatTwice: false
    });
  };

  // Re-draw background lines, grids, and trace templates
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    
    // Draw cross outline grid
    ctx.strokeStyle = profile.mode === 'kids' ? '#f3e8ff' : '#2b3040';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(canvasSize / 2, 0);
    ctx.lineTo(canvasSize / 2, canvasSize);
    ctx.moveTo(0, canvasSize / 2);
    ctx.lineTo(canvasSize, canvasSize / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // If tracing guide is enabled, draw the full character in light gray
    if (traceGuide && currentHanja) {
      drawTraceGuide(ctx);
    }
    
    setCurrentStrokeIndex(0);
    setFeedback({ type: 'info', text: '위의 한자를 순서에 맞춰 따라 써보세요!' });
  };

  // Render the template character outlines on drawing canvas
  const drawTraceGuide = (ctx) => {
    if (!currentHanja) return;
    ctx.strokeStyle = profile.mode === 'kids' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    currentHanja.strokes.forEach(stroke => {
      ctx.beginPath();
      // Stroke points are defined in 0-100 percentages. Map to canvasSize.
      stroke.forEach((pt, idx) => {
        const x = (pt[0] / 100) * canvasSize;
        const y = (pt[1] / 100) * canvasSize;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  };

  // Draw stroke-by-stroke animation on overlays
  const animateStrokeOrder = async () => {
    if (strokeOrderAnimActive || !currentHanja) return;
    setStrokeOrderAnimActive(true);
    
    const animCanvas = animCanvasRef.current;
    if (!animCanvas) return;
    const ctx = animCanvas.getContext('2d');
    
    // Clear overlay
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < currentHanja.strokes.length; i++) {
      ctx.strokeStyle = 'var(--color-primary)';
      const stroke = currentHanja.strokes[i];
      
      // Draw standard line from point to point incrementally
      for (let step = 0; step <= 10; step++) {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // Redraw all completed strokes first
        for (let j = 0; j < i; j++) {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
          ctx.beginPath();
          currentHanja.strokes[j].forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo((pt[0]/100)*canvasSize, (pt[1]/100)*canvasSize);
            else ctx.lineTo((pt[0]/100)*canvasSize, (pt[1]/100)*canvasSize);
          });
          ctx.stroke();
        }
        
        // Draw current stroke incrementally
        ctx.strokeStyle = 'var(--color-primary)';
        ctx.beginPath();
        
        const startX = (stroke[0][0]/100)*canvasSize;
        const startY = (stroke[0][1]/100)*canvasSize;
        ctx.moveTo(startX, startY);
        
        if (stroke.length > 2) {
          // Curved lines
          const midX = (stroke[1][0]/100)*canvasSize;
          const midY = (stroke[1][1]/100)*canvasSize;
          const endX = (stroke[2][0]/100)*canvasSize;
          const endY = (stroke[2][1]/100)*canvasSize;
          
          if (step <= 5) {
            const ratio = step / 5;
            ctx.lineTo(startX + (midX - startX) * ratio, startY + (midY - startY) * ratio);
          } else {
            const ratio = (step - 5) / 5;
            ctx.moveTo(startX, startY);
            ctx.lineTo(midX, midY);
            ctx.lineTo(midX + (endX - midX) * ratio, midY + (endY - midY) * ratio);
          }
        } else {
          // Straight lines
          const endX = (stroke[1][0]/100)*canvasSize;
          const endY = (stroke[1][1]/100)*canvasSize;
          const currentX = startX + (endX - startX) * (step / 10);
          const currentY = startY + (endY - startY) * (step / 10);
          ctx.lineTo(currentX, currentY);
        }
        ctx.stroke();
        
        // Draw starting point circle
        ctx.fillStyle = 'var(--color-accent)';
        ctx.beginPath();
        ctx.arc(startX, startY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        await new Promise(r => setTimeout(r, 40));
      }
      
      await new Promise(r => setTimeout(r, 400));
    }

    // Done animating, clear overlay
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    setStrokeOrderAnimActive(false);
  };

  // Monitor character selection changes
  useEffect(() => {
    resetCanvas();
    speakCurrent();
  }, [selectedHanjaIndex, traceGuide, profile.currentLevel]);

  // Touch and Mouse handlers for drawing canvas
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support touch/mouse coordinates scaling for exact responsiveness on iPhones/tablets
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (e) => {
    if (strokeOrderAnimActive || currentStrokeIndex >= currentHanja.strokes.length) return;
    isDrawingRef.current = true;
    const coords = getCanvasCoordinates(e);
    currentPathRef.current = [coords];
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = 'var(--color-primary)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const coords = getCanvasCoordinates(e);
    currentPathRef.current.push(coords);
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  // Vector stroke checking algorithm
  const verifyStroke = () => {
    isDrawingRef.current = false;
    const userPath = currentPathRef.current;
    if (userPath.length < 2) return;

    const expectedStroke = currentHanja.strokes[currentStrokeIndex];
    if (!expectedStroke) return;

    // Grab user start/end points
    const userStart = userPath[0];
    const userEnd = userPath[userPath.length - 1];

    // Grab expected start/end points (converted to canvas coords)
    const expStart = {
      x: (expectedStroke[0][0] / 100) * canvasSize,
      y: (expectedStroke[0][1] / 100) * canvasSize
    };
    const expEnd = {
      x: (expectedStroke[expectedStroke.length - 1][0] / 100) * canvasSize,
      y: (expectedStroke[expectedStroke.length - 1][1] / 100) * canvasSize
    };

    // Calculate distances
    const distStart = Math.hypot(userStart.x - expStart.x, userStart.y - expStart.y);
    const distEnd = Math.hypot(userEnd.x - expEnd.x, userEnd.y - expEnd.y);
    const distReverseStart = Math.hypot(userStart.x - expEnd.x, userStart.y - expEnd.y);
    const distReverseEnd = Math.hypot(userEnd.x - expStart.x, userEnd.y - expStart.y);

    // Tolerance thresholds (generous for accessibility)
    const threshold = 55;

    // 1. Check if user drew a completely wrong stroke order
    // Let's check other future strokes. If their drawing matches a future stroke instead:
    for (let f = currentStrokeIndex + 1; f < currentHanja.strokes.length; f++) {
      const futureStroke = currentHanja.strokes[f];
      const futStart = { x: (futureStroke[0][0]/100)*canvasSize, y: (futureStroke[0][1]/100)*canvasSize };
      const futEnd = { x: (futureStroke[futureStroke.length-1][0]/100)*canvasSize, y: (futureStroke[futureStroke.length-1][1]/100)*canvasSize };
      
      const matchStart = Math.hypot(userStart.x - futStart.x, userStart.y - futStart.y);
      const matchEnd = Math.hypot(userEnd.x - futEnd.x, userEnd.y - futEnd.y);
      if (matchStart < threshold && matchEnd < threshold) {
        // Yes, user drew a future stroke! Stroke sequence mismatch!
        setFeedback({
          type: 'error',
          text: `획순 오류! ${currentStrokeIndex + 1}번째 획 대신 ${f + 1}번째 획을 먼저 그리셨습니다.`
        });
        triggerHapticShake();
        return;
      }
    }

    // 2. Check if reverse direction
    if (distReverseStart < threshold && distReverseEnd < threshold) {
      setFeedback({
        type: 'error',
        text: '획 그리기 방향 오류! 선을 반대 방향으로 그리셨습니다. 시작점을 확인하세요.'
      });
      triggerHapticShake();
      return;
    }

    // 3. Check shape/distance alignment
    if (distStart < threshold && distEnd < threshold) {
      // Stroke Correct!
      const nextStrokeIndex = currentStrokeIndex + 1;
      setCurrentStrokeIndex(nextStrokeIndex);
      
      if (nextStrokeIndex >= currentHanja.strokes.length) {
        // Complete character correct!
        setFeedback({
          type: 'success',
          text: '참 잘했습니다! 획순 일치율 100% 정답! 🎉'
        });
        
        // Update database stats
        updateAnswerStats(currentHanja.id, true, profile.currentLevel);
        const updatedProfile = { ...profile, xp: profile.xp + 10, gold: profile.gold + 5 };
        onUpdateProfile(updatedProfile);

        if (profile.soundOn) {
          speakKorean("정답입니다", {
            voiceType: 'female',
            rate: 1.3,
            repeatTwice: false,
            skipCancel: true
          });
        }
      } else {
        setFeedback({
          type: 'success',
          text: `좋습니다! ${currentStrokeIndex + 1}번째 획 일치. 다음 획을 그리세요.`
        });
      }
    } else {
      // General alignment error
      setFeedback({
        type: 'error',
        text: '획의 위치나 모양이 일치하지 않습니다. 다시 시도해보세요.'
      });
      triggerHapticShake();
    }
  };

  const triggerHapticShake = () => {
    // Speak corrective voice or play beep if sound is on
    if (profile.soundOn) {
      speakKorean("다시", {
        voiceType: 'female',
        rate: 2.0,
        repeatTwice: false,
        skipCancel: true
      });
    }
    // We add shaking styling to canvas container by state toggle
    const container = document.querySelector('.canvas-container');
    if (container) {
      container.classList.add('anim-shake');
      setTimeout(() => container.classList.remove('anim-shake'), 400);
    }
  };

  const handleNextHanja = () => {
    if (selectedHanjaIndex < levelData.length - 1) {
      setSelectedHanjaIndex(selectedHanjaIndex + 1);
    }
  };

  const handlePrevHanja = () => {
    if (selectedHanjaIndex > 0) {
      setSelectedHanjaIndex(selectedHanjaIndex - 1);
    }
  };

  return (
    <div style={{
      maxWidth: '850px',
      margin: '20px auto',
      width: '100%',
      padding: '0 20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px',
        alignItems: 'start'
      }} className="learning-canvas-split">
        {/* Left Side: Navigation Lists */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <h4 className="font-display" style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>한자 선택 목록</h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '350px',
            overflowY: 'auto'
          }}>
            {levelData.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedHanjaIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: selectedHanjaIndex === idx ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                  color: selectedHanjaIndex === idx ? 'white' : 'var(--color-text-main)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span className="font-display" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{item.char}</span>
                <div style={{ fontSize: '0.85rem' }}>
                  <div>{item.meaning} {item.sound}</div>
                  <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>총 {item.strokes.length}획</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Interactive Drawing Board */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                fontFamily: 'var(--font-display)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{currentHanja?.char}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>
                  ({currentHanja?.meaning} {currentHanja?.sound})
                </span>
                <button
                  onClick={speakCurrent}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                획수: {currentHanja?.strokes.length}획 | 난이도: {profile.currentLevel}
              </p>
            </div>

            {/* Prev/Next controls */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="theme-btn theme-btn-secondary" onClick={handlePrevHanja} disabled={selectedHanjaIndex === 0} style={{ padding: '6px 12px' }}>
                <ChevronLeft size={16} />
              </button>
              <button className="theme-btn theme-btn-secondary" onClick={handleNextHanja} disabled={selectedHanjaIndex === levelData.length - 1} style={{ padding: '6px 12px' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Core Drawing Box */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div className="canvas-container">
                {/* Tracing guide layer (rendered as visual guide underneath canvas if enabled) */}
                <div className="canvas-bg-guide">
                  {traceGuide && currentHanja?.char}
                </div>
                
                {/* Center cross grid overlay */}
                <div className="canvas-grid-overlay">
                  <div></div><div></div>
                  <div></div><div></div>
                </div>

                {/* Drawing Surface */}
                <canvas
                  ref={canvasRef}
                  width={canvasSize}
                  height={canvasSize}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={verifyStroke}
                  onMouseLeave={isDrawingRef.current ? verifyStroke : undefined}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={verifyStroke}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                    cursor: 'crosshair'
                  }}
                />

                {/* Animation Overlay Surface */}
                <canvas
                  ref={animCanvasRef}
                  width={canvasSize}
                  height={canvasSize}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 15,
                    pointerEvents: 'none'
                  }}
                />
              </div>
              
              {/* Stroke Counter */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                zIndex: 20
              }}>
                획순: {currentStrokeIndex} / {currentHanja?.strokes.length}
              </div>
            </div>

            {/* Tracing Options and Explanations */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="theme-btn theme-btn-secondary"
                  onClick={animateStrokeOrder}
                  disabled={strokeOrderAnimActive}
                  style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                >
                  <Play size={14} fill="currentColor" /> 획순 애니메이션 보기
                </button>

                <button
                  className="theme-btn theme-btn-secondary"
                  onClick={resetCanvas}
                  style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
                >
                  <RefreshCw size={14} /> 다시 쓰기 (지우기)
                </button>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', margin: '8px 0' }}>
                  <input
                    type="checkbox"
                    checked={traceGuide}
                    onChange={(e) => setTraceGuide(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>글자 트레이싱 가이드라인 표시</span>
                </label>
              </div>

              {/* Origin explanation */}
              <div style={{
                background: 'var(--bg-app)',
                padding: '12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                lineHeight: '1.5'
              }}>
                <strong>자원 설명:</strong> {currentHanja?.principle}
              </div>
            </div>
          </div>

          {/* Feedback message display */}
          {feedback.text && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px',
              borderRadius: 'var(--border-radius-md)',
              border: `1px solid ${
                feedback.type === 'success' 
                  ? 'var(--color-accent)' 
                  : feedback.type === 'error'
                    ? 'rgba(239, 68, 68, 0.4)'
                    : 'var(--color-border)'
              }`,
              background: 
                feedback.type === 'success'
                  ? 'rgba(46, 196, 182, 0.1)'
                  : feedback.type === 'error'
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'var(--bg-app)',
              color: 
                feedback.type === 'success'
                  ? 'var(--color-accent)'
                  : feedback.type === 'error'
                    ? '#ef4444'
                    : 'var(--color-text-main)'
            }}>
              {feedback.type === 'success' && <Check size={18} />}
              {feedback.type === 'error' && <AlertTriangle size={18} />}
              {feedback.type === 'info' && <Info size={18} />}
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{feedback.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
