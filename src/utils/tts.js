// Robust SpeechSynthesis Wrapper for Cross-Browser Reliability
// Prevents premature garbage collection in Chrome and Safari

let activeUtterances = [];
const audioCache = new Map();
let currentPlayingAudio = null;
let pendingSpeakTimeout = null;
let currentPlaySessionId = 0;

if (typeof window !== 'undefined') {
  if ('speechSynthesis' in window) {
    // Pre-load voices list
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

// Generate Google and Youdao TTS URLs
const getFallbackAudioUrls = (text) => {
  const ts = Date.now(); // Cache buster
  const primary = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ko&client=tw-ob&ts=${ts}`;
  const secondary = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=ko&ts=${ts}`;
  return { primary, secondary };
};

// Preload function for fallback Audio urls
export const preloadKoreanSpeech = (text) => {
  if (typeof window === 'undefined') return;
  const cleanText = text.trim();
  if (!cleanText || audioCache.has(cleanText)) return;

  try {
    console.log(`TTS: Preloading urls for text: "${cleanText}"`);
    const { primary, secondary } = getFallbackAudioUrls(cleanText);
    audioCache.set(cleanText, { primary, secondary });
  } catch (err) {
    console.error(`TTS Cache: Preload failed for "${cleanText}":`, err);
  }
};

// Crucial: Must be called inside a direct user click handler (e.g. Level Selector or Game Start buttons)
export const unlockTtsAudio = () => {
  if (typeof window === 'undefined') return;
  try {
    console.log("TTS: Unlocking SpeechSynthesis & Audio API");
    
    // 1. Unlock SpeechSynthesis
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      u.rate = 2.0;
      window.speechSynthesis.speak(u);
    }
    
    // 2. Unlock Audio API with a valid silent WAV file to avoid decode/format errors
    const dummy = new Audio();
    dummy.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    dummy.volume = 0;
    dummy.play().then(() => {
      console.log("TTS: Audio API unlocked successfully with valid silent WAV");
    }).catch(e => {
      console.warn("TTS: Audio API unlock failed:", e);
    });
  } catch (e) {
    console.warn("TTS: Error unlocking Audio/TTS context:", e);
  }
};

const playFallbackAudio = (text, rate, voiceType, onEnd, onError, repeatTwice = false) => {
  if (typeof window === 'undefined') return;
  const cleanText = text.trim();
  const sessionId = ++currentPlaySessionId;
  let playCount = 0;
  const maxPlays = repeatTwice ? 2 : 1;
  console.log(`TTS Fallback: Playing fresh audio for "${cleanText}" (VoiceType: ${voiceType}, Session: ${sessionId}, Repeats: ${maxPlays})`);

  // 1. Stop any currently playing audio
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.onended = null;
      currentPlayingAudio.onerror = null;
      currentPlayingAudio.pause();
    } catch (e) {
      console.warn("TTS Fallback: Error pausing active audio:", e);
    }
    currentPlayingAudio = null;
  }

  // 2. Fetch URLs from cache or create on the fly
  let cachedUrls = audioCache.get(cleanText);
  if (!cachedUrls) {
    console.log(`TTS Fallback: Cache miss for "${cleanText}". Generating URLs.`);
    try {
      const { primary, secondary } = getFallbackAudioUrls(cleanText);
      cachedUrls = { primary, secondary };
      audioCache.set(cleanText, cachedUrls);
    } catch (err) {
      console.error("TTS Fallback: URL generation failed:", err);
      if (onError) onError(err);
      return;
    }
  }

  // 3. Always instantiate a FRESH Audio object to avoid event listener contamination
  let activeAudio = null;
  try {
    activeAudio = new Audio(cachedUrls.primary);
    activeAudio.preload = 'auto';
  } catch (err) {
    console.error("TTS Fallback: Fresh Audio creation failed:", err);
    if (onError) onError(err);
    return;
  }

  currentPlayingAudio = activeAudio;

  const startPlayback = (audioObj, isSecondary = false) => {
    try {
      // Configure pitch/rate
      try {
        if (voiceType === 'child') {
          if ('preservesPitch' in audioObj) audioObj.preservesPitch = false;
          if ('webkitPreservesPitch' in audioObj) audioObj.webkitPreservesPitch = false;
          audioObj.playbackRate = 1.35;
        } else if (voiceType === 'male') {
          if ('preservesPitch' in audioObj) audioObj.preservesPitch = false;
          if ('webkitPreservesPitch' in audioObj) audioObj.webkitPreservesPitch = false;
          audioObj.playbackRate = 0.82;
        } else {
          if ('preservesPitch' in audioObj) audioObj.preservesPitch = true;
          if ('webkitPreservesPitch' in audioObj) audioObj.webkitPreservesPitch = true;
          audioObj.playbackRate = rate;
        }
      } catch(e) {}

      audioObj.onended = () => {
        if (currentPlaySessionId !== sessionId) {
          audioObj.onended = null;
          audioObj.onerror = null;
          return;
        }
        playCount++;
        if (playCount < maxPlays) {
          console.log(`TTS Fallback: Replaying fresh Audio (${playCount}/${maxPlays})`);
          audioObj.currentTime = 0;
          audioObj.play().catch(e => console.warn("TTS Replay error:", e));
          return;
        }
        console.log(`TTS Fallback: Audio sequence finished.`);
        audioObj.onended = null;
        audioObj.onerror = null;
        if (currentPlayingAudio === audioObj) currentPlayingAudio = null;
        if (onEnd) onEnd();
      };

      audioObj.onerror = (e) => {
        if (currentPlaySessionId !== sessionId) return;
        audioObj.onended = null;
        audioObj.onerror = null;
        
        if (!isSecondary) {
          console.log(`TTS Fallback: Primary failed. Trying fresh secondary audio.`);
          try {
            const secAudio = new Audio(cachedUrls.secondary);
            secAudio.preload = 'auto';
            currentPlayingAudio = secAudio;
            startPlayback(secAudio, true);
          } catch (secErr) {
            console.error("Secondary initialization failed:", secErr);
            if (onError) onError(secErr);
          }
        } else {
          console.error("Both primary and secondary audios failed.");
          if (onError) onError(e);
        }
      };

      audioObj.play().then(() => {
        if (currentPlaySessionId !== sessionId) {
          audioObj.pause();
          audioObj.onended = null;
          audioObj.onerror = null;
        }
      }).catch(errPlay => {
        if (errPlay.name === 'AbortError') return;
        if (audioObj.onerror) audioObj.onerror(errPlay);
      });

    } catch (err) {
      if (onError) onError(err);
    }
  };

  startPlayback(activeAudio, false);
};

export const speakKorean = (text, options = {}) => {
  if (typeof window === 'undefined') return;

  const {
    voiceType = 'female', // 'female' | 'male' | 'child'
    rate = 0.95,
    pitch = null,
    onEnd = null,
    onError = null,
    repeatTwice = false,
    skipCancel = false,
    useCloudTts = true // Prefer high-quality cloud neural voice for premium, natural pronunciation
  } = options;

  // 0. 괄호와 괄호 속 한자/텍스트 완벽히 제거 (전각/반각/대괄호 등 모든 괄호 지원)
  const processedText = text.replace(/[\[(<（【][^\])>）】]*[\])>）】]/g, '').trim();

  // 1. 슬래시(/)가 들어있는 특수 한자 처리 (예: "한국/나라, 한")
  let finalSpeechText = processedText;
  let hasSlash = processedText.includes('/');
  
  if (hasSlash) {
    const parts = processedText.split(',');
    if (parts.length >= 2) {
      const meaningPart = parts[0].trim(); // "한국/나라"
      const soundPart = parts[1].trim();   // "한"
      const meanings = meaningPart.split('/'); // ["한국", "나라"]
      finalSpeechText = meanings.map(m => `${m.trim()} ${soundPart}`).join(', ');
    } else {
      const lastSpaceIndex = text.lastIndexOf(' ');
      if (lastSpaceIndex !== -1) {
        const meaningPart = text.substring(0, lastSpaceIndex).trim();
        const soundPart = text.substring(lastSpaceIndex).trim();
        const meanings = meaningPart.split('/');
        finalSpeechText = meanings.map(m => `${m.trim()} ${soundPart}`).join(', ');
      }
    }
  }

  // 2. repeatTwice 처리
  // 텍스트를 "A, A."로 문자열 병합하면 구글 TTS 엔진 억양이 깨지거나 버그("쌀 미 쌀 미 쌀")가 발생하므로,
  // 텍스트 조작 없이 순수한 단일 오디오 객체를 2번 반복 재생(loop)하도록 플래그만 추출합니다.
  const shouldRepeatAudio = repeatTwice && !hasSlash;

  console.log("TTS: Attempting to speak:", finalSpeechText, "using VoiceType:", voiceType);

  // Stop any active HTML5 audio fallback
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch (e) {
      console.warn("TTS: Error pausing fallback Audio:", e);
    }
    currentPlayingAudio = null;
  }

  try {
    // Cancel previous utterances to avoid queue locks
    if (!skipCancel) {
      if ('speechSynthesis' in window) {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          console.log("TTS: Canceling existing SpeechSynthesis");
          window.speechSynthesis.cancel();
        }
      }
    }
  } catch (cancelErr) {
    console.warn("TTS: Cancel error:", cancelErr);
  }

  // Local native SpeechSynthesis fallback
  const runLocalSpeechSynthesis = () => {
    try {
      if (!('speechSynthesis' in window)) {
        console.log("TTS: SpeechSynthesis not supported.");
        if (onError) onError(new Error("No TTS engine available"));
        return;
      }

      // Create utterance with explicit ko-KR language tag
      const utterance = new SpeechSynthesisUtterance(finalSpeechText);
      utterance.lang = 'ko-KR';

      // Find and set voice if available
      const voices = window.speechSynthesis.getVoices() || [];
      const koVoices = voices.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').includes('ko'));
      
      console.log("TTS: Total system voices:", voices.length, "Korean voices found:", koVoices.length);

      if (koVoices.length > 0) {
        // Score all available Korean voices based on gender preference and quality
        const scoredVoices = koVoices.map(voice => {
          const name = voice.name.toLowerCase();
          let score = 0;

          // Gender/VoiceType Matching
          const isFemaleVoice = name.includes('yuna') || name.includes('sora') || name.includes('yuri') || name.includes('heami') || name.includes('female') || name.includes('siri') && !name.includes('male');
          const isMaleVoice = name.includes('minsu') || name.includes('sejun') || name.includes('male') || name.includes('seung-woo');

          if (voiceType === 'male') {
            if (isMaleVoice) score += 100;
            else if (isFemaleVoice) score -= 100;
          } else {
            // For both female and child, we prefer female voices as child voices are high-pitched
            if (isFemaleVoice) score += 100;
            else if (isMaleVoice) score -= 100;
          }

          // Quality indicators
          if (name.includes('siri')) {
            score += 80;
          }
          if (name.includes('premium') || name.includes('enhanced')) {
            score += 60;
          }
          if (name.includes('sora') || name.includes('sejun')) {
            score += 40;
          }
          if (name.includes('google')) {
            score += 20;
          }
          if (name.includes('yuna') || name.includes('minsu')) {
            score += 10;
          }
          
          // Prefer local service for less latency
          if (voice.localService) {
            score += 5;
          }

          return { voice, score };
        });

        // Sort by score descending
        scoredVoices.sort((a, b) => b.score - a.score);

        let selectedVoice = null;
        if (scoredVoices.length > 0 && scoredVoices[0].score > 0) {
          selectedVoice = scoredVoices[0].voice;
        }

        if (selectedVoice) {
          console.log(`TTS: Selected local voice: "${selectedVoice.name}" (Lang: ${selectedVoice.lang}, Local: ${selectedVoice.localService})`);
          utterance.voice = selectedVoice;
        }
      }

      // Set pitch and rate based on voiceType (pitch === null uses defaults)
      if (pitch !== null) {
        utterance.pitch = pitch;
        utterance.rate = rate;
      } else {
        if (voiceType === 'child') {
          utterance.pitch = 1.45;
          utterance.rate = 1.05 * rate;
        } else if (voiceType === 'male') {
          utterance.pitch = 0.8;
          utterance.rate = rate;
        } else {
          utterance.pitch = 1.05;
          utterance.rate = rate;
        }
      }

      // Reference preservation to bypass the Chrome GC bug
      activeUtterances.push(utterance);
      
      const cleanup = () => {
        activeUtterances = activeUtterances.filter(u => u !== utterance);
      };

      let hasStarted = false;
      utterance.onstart = () => {
        hasStarted = true;
        console.log(`TTS Local: Speech started: "${finalSpeechText}"`);
      };

      let localPlayCount = 0;
      const maxLocalPlays = shouldRepeatAudio ? 2 : 1;

      utterance.onend = () => {
        console.log(`TTS Local: Speech ended: "${finalSpeechText}"`);
        localPlayCount++;
        if (localPlayCount < maxLocalPlays) {
          console.log(`TTS Local: Replaying speech (${localPlayCount}/${maxLocalPlays})`);
          window.speechSynthesis.speak(utterance);
          return;
        }
        cleanup();
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.error(`TTS Local Error: Utterance onError fired. Error: ${e.error || 'unknown'}`, e);
        cleanup();
        // Fallback to cloud audio if local speech synthesis fails
        playFallbackAudio(finalSpeechText, rate, voiceType, onEnd, onError);
      };

      // Speak
      console.log("TTS Local: Calling speechSynthesis.speak()");
      if (window.speechSynthesis.resume) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);

      // Watchdog Timer: If local engine hangs, force fallback to Audio
      setTimeout(() => {
        if (!hasStarted) {
          console.warn("TTS Local Warning: Local speech engine hanging! Falling back to Audio API.");
          window.speechSynthesis.cancel();
          playFallbackAudio(finalSpeechText, rate, voiceType, onEnd, onError);
        }
      }, 3000);

    } catch (err) {
      console.error("TTS Local Error: Speech synthesis failed with exception:", err);
      playFallbackAudio(finalSpeechText, rate, voiceType, onEnd, onError);
    }
  };

  const runSpeak = () => {
    // 무조건 구글 번역 TTS URL (https://translate.google.com/translate_tts?...) 주소를 활용한 오디오 객체 재생을 최우선 시도
    console.log("TTS: Using Google Translate Cloud TTS for natural voice.");
    playFallbackAudio(finalSpeechText, rate, voiceType, onEnd, (err) => {
      console.warn("TTS: Google Translate TTS failed. Falling back to local SpeechSynthesis:", err);
      runLocalSpeechSynthesis();
    }, shouldRepeatAudio);
  };

  if (skipCancel) {
    runSpeak();
  } else {
    pendingSpeakTimeout = setTimeout(runSpeak, 100);
  }
};

export const cancelSpeech = () => {
  currentPlaySessionId++; // 만료 처리 (비동기 오디오 프로미스 컷오프)
  
  if (pendingSpeakTimeout) {
    clearTimeout(pendingSpeakTimeout);
    pendingSpeakTimeout = null;
  }

  if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.error("TTS Error: Failed to cancel speechSynthesis:", e);
      }
    }
    activeUtterances = [];
    if (currentPlayingAudio) {
      try {
        currentPlayingAudio.onended = null;
        currentPlayingAudio.onerror = null;
        currentPlayingAudio.pause();
        currentPlayingAudio.currentTime = 0;
      } catch (e) {
        console.error("TTS Error: Failed to pause fallback audio:", e);
      }
      currentPlayingAudio = null;
    }
  }
};
