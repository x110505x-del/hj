import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Volume2, VolumeX, Eye } from 'lucide-react';
import { getHanjaByLevel } from '../services/hanjaDb';
import { speakKorean, unlockTtsAudio } from '../utils/tts';

// Predefined coordinate strokes for 8급 characters (Normalized 100x100 space)
const STROKE_COORDINATES = {
  '一': [[[15, 50], [85, 50]]],
  '二': [[[30, 35], [70, 35]], [[15, 65], [85, 65]]],
  '三': [[[25, 30], [75, 30]], [[35, 50], [65, 50]], [[15, 70], [85, 70]]],
  '十': [[[15, 50], [85, 50]], [[50, 15], [50, 85]]],
  '八': [[[45, 30], [20, 75]], [[55, 30], [80, 75]]],
  '人': [[[50, 15], [20, 85]], [[35, 50], [80, 85]]],
  '大': [[[15, 40], [85, 40]], [[50, 15], [50, 40], [20, 85]], [[50, 40], [80, 85]]],
  '小': [[[50, 15], [50, 75], [40, 85]], [[25, 45], [15, 60]], [[75, 45], [85, 60]]],
  '口': [[[25, 25], [25, 75]], [[25, 25], [75, 25], [75, 75]], [[25, 75], [75, 75]]],
  '日': [[[25, 20], [25, 80]], [[25, 20], [75, 20], [75, 80]], [[25, 50], [75, 50]], [[25, 80], [75, 80]]],
  '月': [[[28, 20], [28, 80]], [[28, 20], [72, 20], [72, 80]], [[28, 40], [72, 40]], [[28, 60], [72, 60]]],
  '山': [[[50, 20], [50, 80]], [[25, 45], [25, 80], [75, 80]], [[75, 45], [75, 80]]],
  '川': [[[30, 25], [30, 75]], [[50, 25], [50, 75]], [[70, 20], [70, 80]]],
  '木': [[[15, 35], [85, 35]], [[50, 10], [50, 90]], [[50, 35], [20, 80]], [[50, 35], [80, 80]]],
  '火': [[[25, 35], [15, 50]], [[75, 35], [85, 50]], [[50, 15], [50, 45], [20, 85]], [[50, 45], [80, 85]]],
  '水': [[[50, 10], [50, 75], [38, 85]], [[20, 40], [45, 40]], [[15, 75], [45, 55]], [[55, 30], [85, 75]]],
  '土': [[[25, 40], [75, 40]], [[50, 15], [50, 80]], [[15, 80], [85, 80]]],
  '中': [[[25, 25], [25, 65]], [[25, 25], [75, 25], [75, 65]], [[25, 65], [75, 65]], [[50, 10], [50, 90]]],
  '九': [[[35, 20], [35, 45], [15, 75]], [[20, 40], [80, 40], [80, 80], [90, 75]]],
  '五': [[[25, 25], [75, 25]], [[50, 25], [35, 65]], [[35, 65], [75, 65], [75, 75]], [[20, 75], [80, 75]]],
  '六': [[[50, 15], [50, 30]], [[20, 45], [80, 45]], [[35, 60], [20, 80]], [[65, 60], [80, 80]]],
  '七': [[[20, 50], [80, 40]], [[45, 20], [45, 70], [75, 70], [80, 60]]],
  '子': [[[25, 25], [75, 25], [35, 55]], [[35, 55], [55, 55], [55, 80], [45, 85]], [[20, 55], [80, 55]]],
  '女': [[[50, 15], [25, 60], [65, 80]], [[65, 30], [25, 85]], [[15, 50], [85, 50]]],
  '父': [[[35, 25], [20, 40]], [[65, 25], [80, 40]], [[50, 40], [15, 85]], [[35, 45], [85, 85]]],
  '母': [[[35, 20], [25, 70], [75, 70]], [[25, 20], [75, 20], [75, 70]], [[30, 45], [70, 45]], [[50, 15], [50, 75]], [[50, 50], [50, 50]]],
  '門': [[[25, 20], [25, 85]], [[25, 20], [45, 20], [45, 50]], [[25, 50], [45, 50]], [[55, 20], [55, 50]], [[55, 20], [75, 20], [75, 85], [65, 80]], [[55, 50], [75, 50]]],
  '外': [[[35, 20], [20, 45]], [[20, 45], [45, 45], [30, 85]], [[25, 50], [45, 75]], [[65, 25], [65, 85]], [[65, 55], [85, 55]]],
  '國': [[[20, 15], [20, 85]], [[20, 15], [80, 15], [80, 85]], [[35, 30], [65, 30]], [[45, 30], [45, 65]], [[35, 50], [65, 50]], [[35, 65], [65, 65]], [[65, 35], [65, 65]], [[20, 85], [80, 85]]],
  '軍': [[[30, 15], [70, 15]], [[30, 15], [30, 35]], [[30, 35], [70, 35]], [[50, 15], [50, 35]], [[20, 45], [80, 45]], [[30, 50], [30, 75]], [[30, 50], [70, 50], [70, 75]], [[30, 62], [70, 62]], [[30, 75], [70, 75]], [[50, 45], [50, 90]]],
  '民': [[[25, 20], [75, 20]], [[25, 20], [25, 85]], [[25, 45], [70, 40]], [[25, 60], [75, 55]], [[50, 20], [50, 85], [80, 85], [85, 75]]],
  '王': [[[25, 25], [75, 25]], [[50, 25], [50, 75]], [[32, 50], [68, 50]], [[15, 75], [85, 75]]],
  '靑': [[[30, 20], [70, 20]], [[50, 20], [50, 55]], [[35, 38], [65, 38]], [[25, 55], [75, 55]], [[32, 55], [32, 85]], [[32, 55], [68, 55], [68, 85]], [[32, 70], [68, 70]], [[32, 85], [68, 85]]],
  '白': [[[50, 15], [45, 25]], [[30, 30], [30, 80]], [[30, 30], [70, 30], [70, 80]], [[30, 55], [70, 55]], [[30, 80], [70, 80]]],
  '적': [[[50, 15], [50, 35]], [[25, 35], [75, 35]], [[20, 55], [80, 55]], [[50, 35], [50, 75]], [[35, 65], [15, 85]], [[65, 65], [85, 85]]],
  '黃': [[[30, 15], [70, 15]], [[40, 15], [40, 30]], [[60, 15], [60, 30]], [[20, 30], [80, 30]], [[30, 45], [70, 45]], [[30, 45], [30, 65], [70, 65], [70, 45]], [[30, 55], [70, 55]], [[50, 30], [50, 65]], [[32, 75], [20, 90]], [[68, 75], [80, 90]]],
  '校': [[[20, 30], [50, 30]], [[35, 15], [35, 85]], [[35, 35], [20, 60]], [[35, 35], [48, 60]], [[65, 15], [60, 30]], [[52, 40], [88, 40]], [[70, 40], [70, 85]], [[70, 55], [55, 75]], [[70, 55], [85, 75]]],
  '學': [[[30, 15], [25, 25]], [[45, 12], [45, 20]], [[60, 15], [65, 25]], [[20, 30], [20, 40], [80, 40], [80, 30]], [[32, 30], [68, 30]], [[35, 45], [65, 45]], [[25, 55], [75, 55]], [[50, 55], [50, 85]], [[50, 55], [20, 75]], [[50, 55], [80, 75]]],
  '先': [[[35, 25], [65, 25]], [[50, 15], [50, 50]], [[20, 50], [80, 50]], [[50, 50], [25, 85]], [[35, 65], [70, 65], [75, 80]]],
  '生': [[[35, 25], [20, 40]], [[25, 45], [75, 45]], [[50, 15], [50, 80]], [[35, 62], [65, 62]], [[15, 80], [85, 80]]],
  '市': [[[50, 15], [50, 30]], [[25, 40], [75, 40]], [[35, 40], [35, 65]], [[35, 40], [65, 40], [65, 65]], [[50, 40], [50, 85]]],
  '邑': [[[30, 20], [30, 45]], [[30, 20], [70, 20], [70, 45]], [[30, 45], [70, 45]], [[25, 55], [75, 55]], [[30, 55], [30, 80], [70, 80]], [[50, 55], [50, 85]]],
  '面': [[[20, 20], [80, 20]], [[50, 20], [50, 40]], [[30, 40], [70, 40]], [[25, 40], [25, 85]], [[25, 40], [75, 40], [75, 85]], [[45, 40], [45, 85]], [[58, 40], [58, 85]], [[25, 62], [75, 62]], [[25, 85], [75, 85]]],
  '洞': [[[25, 25], [20, 35]], [[20, 50], [30, 60]], [[15, 75], [30, 70]], [[45, 25], [45, 75]], [[45, 25], [85, 25], [85, 75]], [[55, 45], [75, 45]], [[55, 45], [55, 65]], [[55, 65], [75, 65]]],
  '車': [[[25, 25], [75, 25]], [[25, 25], [25, 50], [75, 50], [75, 25]], [[25, 38], [75, 38]], [[15, 62], [85, 62]], [[50, 10], [50, 90]], [[20, 75], [80, 75]]],
  '力': [[[30, 30], [70, 30], [70, 75], [60, 70]], [[55, 15], [30, 85]]],
  '東': [[[25, 20], [75, 20]], [[25, 35], [25, 65]], [[25, 35], [75, 35], [75, 65]], [[25, 50], [75, 50]], [[25, 65], [75, 65]], [[50, 10], [50, 90]], [[50, 50], [20, 80]], [[50, 50], [80, 80]]],
  '西': [[[20, 20], [80, 20]], [[30, 20], [30, 80]], [[30, 20], [70, 20], [70, 80]], [[30, 45], [70, 45]], [[45, 45], [45, 80]], [[30, 80], [70, 80]]],
  '南': [[[25, 15], [75, 15]], [[50, 15], [50, 30]], [[20, 30], [20, 85]], [[20, 30], [80, 30], [80, 85]], [[35, 45], [65, 45]], [[35, 45], [35, 75]], [[35, 60], [65, 60]], [[50, 45], [50, 75]]],
  '萬': [[[25, 15], [75, 15]], [[35, 15], [35, 30]], [[65, 15], [65, 30]], [[20, 30], [80, 30]], [[30, 30], [30, 55], [70, 55], [70, 30]], [[30, 42], [70, 42]], [[30, 55], [70, 55]], [[50, 30], [50, 55]], [[25, 70], [15, 85]], [[55, 70], [85, 85]]],
  '敎': [[[40, 20], [20, 40]], [[20, 40], [60, 40]], [[25, 60], [55, 60]], [[35, 45], [35, 80]], [[55, 20], [80, 45]], [[80, 45], [60, 85]], [[65, 60], [85, 80]]],
  '金': [[[50, 15], [25, 40]], [[50, 15], [75, 40]], [[35, 45], [65, 45]], [[20, 65], [80, 65]], [[50, 30], [50, 90]], [[35, 75], [25, 85]], [[65, 75], [75, 85]], [[15, 90], [85, 90]]],
  '金': [[[50, 15], [25, 40]], [[50, 15], [75, 40]], [[35, 45], [65, 45]], [[20, 65], [80, 65]], [[50, 30], [50, 90]], [[35, 75], [25, 85]], [[65, 75], [75, 85]], [[15, 90], [85, 90]]],
  '赤': [[[50, 15], [50, 35]], [[25, 35], [75, 35]], [[20, 55], [80, 55]], [[50, 35], [50, 75]], [[35, 65], [15, 85]], [[65, 65], [85, 85]]],
  '靑': [[[30, 20], [70, 20]], [[50, 20], [50, 55]], [[35, 38], [65, 38]], [[25, 55], [75, 55]], [[32, 55], [32, 85]], [[32, 55], [68, 55], [68, 85]], [[32, 70], [68, 70]], [[32, 85], [68, 85]]],
  '韓': [[[20, 25], [45, 25]], [[20, 40], [45, 40]], [[32, 15], [32, 80]], [[20, 60], [45, 60]], [[20, 80], [45, 80]], [[48, 30], [48, 75]], [[48, 30], [58, 20], [58, 80]], [[65, 20], [82, 20]], [[75, 20], [75, 85]], [[65, 50], [82, 50]], [[65, 80], [82, 80]]]
};

export default function HanjaWritingPractice({ level, onBack, soundOn, onToggleSound }) {
  const allHanja = getHanjaByLevel(level);
  
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0); // 0.5x, 1.0x, 1.5x

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const strokeProgressRef = useRef(0); // 0 to 1 for current stroke
  const currentStrokeIndexRef = useRef(0);
  const pauseTimerRef = useRef(null);
  const isCompletedPauseRef = useRef(false); // Controls 1.8s freeze of completed solid character
  
  const canvasSize = 260;
  const currentHanja = allHanja[currentIndex];

  const initialSpeakTriggeredRef = useRef(false);

  const handleNext = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    isCompletedPauseRef.current = false;
    setCurrentIndex((prev) => (prev + 1) % allHanja.length);
    strokeProgressRef.current = 0;
    currentStrokeIndexRef.current = 0;
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    isCompletedPauseRef.current = false;
    setCurrentIndex((prev) => (prev - 1 + allHanja.length) % allHanja.length);
    strokeProgressRef.current = 0;
    currentStrokeIndexRef.current = 0;
    setIsPlaying(true);
  };

  // Speak current Hanja pronunciation with repeatTwice
  const speakCurrent = (skipCancel = false) => {
    if (!currentHanja || !soundOn) return;
    speakKorean(`${currentHanja.meaning} ${currentHanja.sound}`, {
      repeatTwice: true,
      skipCancel: skipCancel === true
    });
  };

  // Trigger speech when card changes
  useEffect(() => {
    if (hasStarted && currentHanja) {
      if (initialSpeakTriggeredRef.current) {
        initialSpeakTriggeredRef.current = false;
        return;
      }
      speakCurrent();
    }
  }, [currentIndex, hasStarted]);

  // Handle animation loop
  useEffect(() => {
    if (!hasStarted || !currentHanja || !isPlaying) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const vectorStrokes = STROKE_COORDINATES[currentHanja.char];
    const hasVector = !!vectorStrokes;
    const textX = canvasSize / 2;
    const textY = canvasSize / 2 + 10;
    const fontStr = 'bold 150px "AppleMyungjo", "Songti SC", "Songti TC", "Batang", serif';

    // Translates normalized 100x100 coordinates to align perfectly with the Myeongjo font glyph
    const getCanvasCoords = (pt) => {
      const scale = 0.82; // Shrinks vector scale to exactly match 150px font bounding box
      const x = textX + ((pt[0] - 50) / 100) * canvasSize * scale;
      const y = textY + ((pt[1] - 50) / 100) * canvasSize * scale;
      return { x, y };
    };
    
    const drawGrid = () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      
      // Draw grid container border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      // Center lines
      ctx.beginPath();
      ctx.moveTo(canvasSize / 2, 0);
      ctx.lineTo(canvasSize / 2, canvasSize);
      ctx.moveTo(0, canvasSize / 2);
      ctx.lineTo(canvasSize, canvasSize / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Main animation loop
    const animate = () => {
      drawGrid();

      // If in completed freeze state, draw completed solid text directly and request next frame
      if (isCompletedPauseRef.current) {
        ctx.save();
        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1e293b'; // Solid completed text
        ctx.fillText(currentHanja.char, textX, textY);
        ctx.restore();

        if (isPlaying) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        return;
      }

      // Create primary offscreen canvas to hold the text mask (destination)
      const offscreen = document.createElement('canvas');
      offscreen.width = canvasSize;
      offscreen.height = canvasSize;
      const oCtx = offscreen.getContext('2d');

      // Draw the text glyph (destination pixels)
      oCtx.font = fontStr;
      oCtx.textAlign = 'center';
      oCtx.textBaseline = 'middle';
      oCtx.fillStyle = '#1e293b';
      oCtx.fillText(currentHanja.char, textX, textY);

      // Create a temporary canvas to paint all strokes together in normal source-over mode
      const strokesCanvas = document.createElement('canvas');
      strokesCanvas.width = canvasSize;
      strokesCanvas.height = canvasSize;
      const sCtx = strokesCanvas.getContext('2d');

      let brushX = 0;
      let brushY = 0;
      let isBrushActive = false;

      if (hasVector) {
        // --- Premium Vector Path Drawing ---
        const totalStrokes = vectorStrokes.length;
        const currentStrokeIdx = currentStrokeIndexRef.current;

        // Draw all completed strokes in normal mode
        sCtx.strokeStyle = '#1e293b';
        sCtx.lineWidth = 26; 
        sCtx.lineCap = 'round';
        sCtx.lineJoin = 'round';
        
        for (let i = 0; i < currentStrokeIdx; i++) {
          sCtx.beginPath();
          const stroke = vectorStrokes[i];
          stroke.forEach((pt, idx) => {
            const coords = getCanvasCoords(pt);
            if (idx === 0) sCtx.moveTo(coords.x, coords.y);
            else sCtx.lineTo(coords.x, coords.y);
          });
          sCtx.stroke();
        }

        // Draw the current animating stroke
        if (currentStrokeIdx < totalStrokes) {
          const stroke = vectorStrokes[currentStrokeIdx];
          sCtx.beginPath();
          
          const startCoords = getCanvasCoords(stroke[0]);
          sCtx.moveTo(startCoords.x, startCoords.y);
          
          brushX = startCoords.x;
          brushY = startCoords.y;

          // Interpolate current stroke position
          if (stroke.length === 2) {
            const endCoords = getCanvasCoords(stroke[1]);
            brushX = startCoords.x + (endCoords.x - startCoords.x) * strokeProgressRef.current;
            brushY = startCoords.y + (endCoords.y - startCoords.y) * strokeProgressRef.current;
            sCtx.lineTo(brushX, brushY);
          } else if (stroke.length > 2) {
            const midCoords = getCanvasCoords(stroke[1]);
            const endCoords = getCanvasCoords(stroke[2]);
            
            if (strokeProgressRef.current <= 0.5) {
              const ratio = strokeProgressRef.current * 2;
              brushX = startCoords.x + (midCoords.x - startCoords.x) * ratio;
              brushY = startCoords.y + (midCoords.y - startCoords.y) * ratio;
              sCtx.lineTo(brushX, brushY);
            } else {
              const ratio = (strokeProgressRef.current - 0.5) * 2;
              sCtx.lineTo(midCoords.x, midCoords.y);
              brushX = midCoords.x + (endCoords.x - midCoords.x) * ratio;
              brushY = midCoords.y + (endCoords.y - midCoords.y) * ratio;
              sCtx.lineTo(brushX, brushY);
            }
          }
          sCtx.stroke();
          isBrushActive = true;

          // Progress incremental steps (adjusted by Speed multiplier)
          strokeProgressRef.current += 0.025 * speed;

          if (strokeProgressRef.current >= 1.0) {
            strokeProgressRef.current = 0;
            currentStrokeIndexRef.current += 1;
          }
        } else {
          // Completed drawing: enter freeze mode
          isCompletedPauseRef.current = true;
          pauseTimerRef.current = setTimeout(() => {
            isCompletedPauseRef.current = false;
            currentStrokeIndexRef.current = 0;
            strokeProgressRef.current = 0;
          }, 1800);
        }

      } else {
        // --- Fallback Procedural sweep for characters without vector coordinates ---
        const sweepProgress = strokeProgressRef.current;
        
        if (sweepProgress >= 1.0) {
          isCompletedPauseRef.current = true;
          pauseTimerRef.current = setTimeout(() => {
            isCompletedPauseRef.current = false;
            strokeProgressRef.current = 0;
          }, 1800);
        } else {
          const sweepRadius = sweepProgress * (canvasSize * 1.5);
          
          // Draw expanding gradient circle from top-left (0,0) on strokesCanvas
          const gradient = sCtx.createRadialGradient(0, 0, 0, 0, 0, sweepRadius);
          gradient.addColorStop(0, '#1e293b');
          gradient.addColorStop(0.9, '#334155');
          gradient.addColorStop(1, 'transparent');
          sCtx.fillStyle = gradient;
          sCtx.fillRect(0, 0, canvasSize, canvasSize);
          
          // Animate a brush cursor tracing the character bounds as it sweeps
          brushX = canvasSize / 4 + (canvasSize / 2) * sweepProgress + Math.sin(sweepProgress * Math.PI * 4) * 30;
          brushY = canvasSize / 4 + (canvasSize / 2) * sweepProgress + Math.cos(sweepProgress * Math.PI * 4) * 20;
          isBrushActive = true;
          strokeProgressRef.current += 0.008 * speed;
        }
      }

      // 3. Clip the combined drawn strokes (source) onto the text mask (destination)
      oCtx.globalCompositeOperation = 'source-in';
      oCtx.drawImage(strokesCanvas, 0, 0);

      // Draw the masked offscreen canvas onto primary canvas
      ctx.drawImage(offscreen, 0, 0);

      // Draw red brush tip on top (not masked!)
      if (isBrushActive && isPlaying) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(brushX, brushY, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [currentIndex, hasStarted, isPlaying, speed]);

  const handleRestartAnim = () => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    isCompletedPauseRef.current = false;
    strokeProgressRef.current = 0;
    currentStrokeIndexRef.current = 0;
    setIsPlaying(true);
  };

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
            한자쓰기 연습
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            한자의 획이 써지는 순서를 눈으로 관찰하며 획순을 익힐 수 있습니다.<br/>
            시작 버튼을 누르면 획순 애니메이션이 즉시 재생됩니다.
          </p>
        </div>
        
        <button 
          onClick={() => {
            unlockTtsAudio();
            initialSpeakTriggeredRef.current = true;
            setHasStarted(true);
            speakCurrent(true);
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
          <Play size={22} fill="currentColor" /> 연습 시작하기
        </button>

        {/* TTS Toggle Button on Start Screen */}
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

  if (allHanja.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>선택하신 급수에 등록된 한자가 없습니다.</p>
        <button onClick={onBack} className="theme-btn theme-btn-primary">목록으로</button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '520px',
      width: '100%',
      margin: '0 auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxSizing: 'border-box'
    }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} className="theme-btn" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '0.85rem'
        }}>
          <ArrowLeft size={14} /> 목록
        </button>
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
          {level} 쓰기 연습 ({currentIndex + 1} / {allHanja.length})
        </span>
      </div>

      {/* Main Practice Card */}
      <div className="glass-card" style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: '20px',
        border: '1px solid var(--color-border)',
        backgroundColor: '#ffffff'
      }}>
        {/* Drawing Canvas Area */}
        <div style={{
          position: 'relative',
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '2.5px solid var(--color-primary)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            style={{ display: 'block' }}
          />
          
          {/* Optional Indicator for Fallback sweeper */}
          {!STROKE_COORDINATES[currentHanja.char] && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(241,245,249,0.9)',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              border: '1px solid #e2e8f0'
            }}>
              <Eye size={10} /> 전체 획순 시뮬레이션
            </div>
          )}
        </div>

        {/* Meaning & Sound Display Below Canvas */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span>[{currentHanja.fullMeaning || `${currentHanja.meaning} ${currentHanja.sound}`}]</span>
            <button
              onClick={() => speakCurrent(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="발음 듣기"
            >
              <Volume2 size={18} />
            </button>
          </div>
          
          {currentHanja.example && (
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              marginTop: '6px',
              backgroundColor: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              예시: {currentHanja.example}
            </p>
          )}
        </div>

        {/* Animation & Speed Control Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: '12px',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '16px'
        }}>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="theme-btn theme-btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minWidth: '96px'
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? '일시정지' : '재생'}
            </button>
            
            <button
              onClick={handleRestartAnim}
              className="theme-btn theme-btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={14} /> 처음부터
            </button>
          </div>

          {/* Speed Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)'
          }}>
            <span>속도:</span>
            {[0.5, 1.0, 1.5].map((speedVal) => (
              <button
                key={speedVal}
                onClick={() => setSpeed(speedVal)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: speed === speedVal ? 'var(--color-primary)' : '#ffffff',
                  color: speed === speedVal ? '#ffffff' : 'var(--color-text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {speedVal}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Card Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
        <button onClick={handlePrev} className="theme-btn" style={{
          flex: 1,
          padding: '10px 16px',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          backgroundColor: '#ffffff',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer'
        }}>
          <ChevronLeft size={16} /> 이전 한자
        </button>
        <button onClick={handleNext} className="theme-btn theme-btn-primary" style={{
          flex: 1,
          padding: '10px 16px',
          borderRadius: '10px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer'
        }}>
          다음 한자 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
