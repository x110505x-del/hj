// Robust SpeechSynthesis Wrapper for Cross-Browser Reliability
// Prevents premature garbage collection in Chrome and Safari

let activeUtterances = [];
const audioCache = new Map();
let currentPlayingAudio = null;

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
  const primary = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ko&client=tw-ob`;
  const secondary = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=ko`;
  return { primary, secondary };
};

// Preload function for fallback Audio
export const preloadKoreanSpeech = (text) => {
  if (typeof window === 'undefined') return;
  const cleanText = text.trim();
  if (!cleanText || audioCache.has(cleanText)) return;

  try {
    console.log(`TTS: Preloading audio for text: "${cleanText}"`);
    const { primary, secondary } = getFallbackAudioUrls(cleanText);

    // Preload primary Google TTS
    const primaryAudio = new Audio();
    primaryAudio.src = primary;
    primaryAudio.preload = 'auto';
    primaryAudio.load();

    // Preload secondary Youdao TTS
    const secondaryAudio = new Audio();
    secondaryAudio.src = secondary;
    secondaryAudio.preload = 'auto';
    secondaryAudio.load();

    audioCache.set(cleanText, { primary: primaryAudio, secondary: secondaryAudio });
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

const playFallbackAudio = (text, rate, voiceType, onEnd, onError) => {
  if (typeof window === 'undefined') return;
  const cleanText = text.trim();
  console.log(`TTS Fallback: Playing audio for "${cleanText}" (VoiceType: ${voiceType})`);

  // 1. Pause any currently playing audio
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch (e) {
      console.warn("TTS Fallback: Error pausing active audio:", e);
    }
    currentPlayingAudio = null;
  }

  // 2. Fetch from cache or create on the fly
  let cached = audioCache.get(cleanText);
  if (!cached) {
    console.log(`TTS Fallback: Cache miss for "${cleanText}". Creating audio on the fly.`);
    try {
      const { primary, secondary } = getFallbackAudioUrls(cleanText);
      const primaryAudio = new Audio(primary);
      primaryAudio.preload = 'auto';
      const secondaryAudio = new Audio(secondary);
      secondaryAudio.preload = 'auto';
      cached = { primary: primaryAudio, secondary: secondaryAudio };
      audioCache.set(cleanText, cached);
    } catch (err) {
      console.error("TTS Fallback: Audio creation crashed:", err);
      if (onError) onError(err);
      return;
    }
  }

  const activeAudio = cached.primary;
  currentPlayingAudio = activeAudio;

  try {
    // Configure pitch shifting or speed changes based on voiceType safely
    try {
      if (voiceType === 'child') {
        if ('preservesPitch' in activeAudio) activeAudio.preservesPitch = false;
        if ('webkitPreservesPitch' in activeAudio) activeAudio.webkitPreservesPitch = false;
        activeAudio.playbackRate = 1.35;
      } else if (voiceType === 'male') {
        if ('preservesPitch' in activeAudio) activeAudio.preservesPitch = false;
        if ('webkitPreservesPitch' in activeAudio) activeAudio.webkitPreservesPitch = false;
        activeAudio.playbackRate = 0.82;
      } else {
        if ('preservesPitch' in activeAudio) activeAudio.preservesPitch = true;
        if ('webkitPreservesPitch' in activeAudio) activeAudio.webkitPreservesPitch = true;
        activeAudio.playbackRate = rate;
      }
    } catch(e) { console.warn('Safari Pitch attribute error:', e); }

    // Attach callbacks
    activeAudio.onended = () => {
      console.log(`TTS Fallback: Primary Audio ended for "${cleanText}"`);
      if (currentPlayingAudio === activeAudio) currentPlayingAudio = null;
      if (onEnd) onEnd();
    };

    activeAudio.onerror = (e) => {
      const errorMsg = activeAudio.error 
        ? `Code ${activeAudio.error.code}; Message: ${activeAudio.error.message}` 
        : 'Unknown audio element error';
      console.error(`TTS Fallback Error: Primary audio failed to load/play for "${cleanText}". Error: ${errorMsg}`, e);

      // Try secondary voice fallback (Youdao)
      try {
        console.log(`TTS Fallback: Trying secondary fallback voice for "${cleanText}"...`);
        const secAudio = cached.secondary;
        currentPlayingAudio = secAudio;
        
        try {
          if (voiceType === 'child') {
            if ('preservesPitch' in secAudio) secAudio.preservesPitch = false;
            if ('webkitPreservesPitch' in secAudio) secAudio.webkitPreservesPitch = false;
            secAudio.playbackRate = 1.35;
          } else if (voiceType === 'male') {
            if ('preservesPitch' in secAudio) secAudio.preservesPitch = false;
            if ('webkitPreservesPitch' in secAudio) secAudio.webkitPreservesPitch = false;
            secAudio.playbackRate = 0.82;
          } else {
            if ('preservesPitch' in secAudio) secAudio.preservesPitch = true;
            if ('webkitPreservesPitch' in secAudio) secAudio.webkitPreservesPitch = true;
            secAudio.playbackRate = rate;
          }
        } catch(e) {}

        secAudio.onended = () => {
          console.log(`TTS Fallback: Secondary Audio ended for "${cleanText}"`);
          if (currentPlayingAudio === secAudio) currentPlayingAudio = null;
          if (onEnd) onEnd();
        };

        secAudio.onerror = (err2) => {
          const secErrorMsg = secAudio.error 
            ? `Code ${secAudio.error.code}; Message: ${secAudio.error.message}` 
            : 'Unknown audio element error';
          console.error(`TTS Fallback Error: Both primary and secondary voice audio failed for "${cleanText}". Secondary error: ${secErrorMsg}`, err2);
          if (currentPlayingAudio === secAudio) currentPlayingAudio = null;
          if (onError) onError(err2);
        };

        secAudio.play().catch(errPlay => {
          if (errPlay.name === 'AbortError') {
            console.log("TTS Fallback: Secondary play aborted (new audio started).");
            return;
          }
          console.error(`TTS Fallback Error: Secondary audio play() promise rejected for "${cleanText}":`, errPlay);
          if (onError) onError(errPlay);
        });
      } catch (errSecondary) {
        console.error(`TTS Fallback Error: Secondary setup failed for "${cleanText}":`, errSecondary);
        if (onError) onError(errSecondary);
      }
    };

    activeAudio.play().then(() => {
      console.log(`TTS Fallback: Playing primary Audio for "${cleanText}" successfully`);
    }).catch(e => {
      if (e.name === 'AbortError') {
        console.log("TTS Fallback: Primary play aborted (new audio started).");
        return;
      }
      console.error(`TTS Fallback Error: Primary audio play() promise rejected for "${cleanText}":`, e);
      // Trigger error fallback path manually
      if (activeAudio.onerror) {
        activeAudio.onerror(e);
      }
    });

  } catch (err) {
    console.error(`TTS Fallback Error: Playback execution crashed for "${cleanText}":`, err);
    if (onError) onError(err);
  }
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

  // Format text: if repeatTwice is requested, read meaning and sound twice
  let finalSpeechText = text;
  if (repeatTwice) {
    // Clean text and join with a comma for a natural short pause
    const cleaned = text.replace(/[.,]/g, '').trim();
    finalSpeechText = `${cleaned}, ${cleaned}.`;
  }

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

      utterance.onend = () => {
        console.log("TTS Local: Utterance onEnd fired");
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
    });
  };

  if (skipCancel) {
    runSpeak();
  } else {
    setTimeout(runSpeak, 100);
  }
};

export const cancelSpeech = () => {
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
        currentPlayingAudio.pause();
        currentPlayingAudio.currentTime = 0;
      } catch (e) {
        console.error("TTS Error: Failed to pause fallback audio:", e);
      }
      currentPlayingAudio = null;
    }
  }
};
