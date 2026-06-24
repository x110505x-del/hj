import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Volume2, VolumeX, Eye } from 'lucide-react';
import { getHanjaByLevel, HANJA_RAW_DATA, HANJA_LEVELS } from '../services/hanjaDb';
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
  const allHanja = useMemo(() => {
    const list = [];
    const seenChars = new Set();
    
    // Accumulate all characters from all levels
    HANJA_LEVELS.forEach(lvl => {
      const data = HANJA_RAW_DATA[lvl] || [];
      data.forEach(h => {
        if (!seenChars.has(h.char)) {
          seenChars.add(h.char);
          list.push({ ...h, levelOrigin: lvl });
        }
      });
    });
    return list;
  }, []);
  
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
  
  const [strokeData, setStrokeData] = useState(null);
  const [isLoadingStrokes, setIsLoadingStrokes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const canvasSize = 260;
  const currentHanja = allHanja[currentIndex];

  const initialSpeakTriggeredRef = useRef(false);

  // Filter Hanja by search query (Korean sound matching)
  const filteredHanja = useMemo(() => {
    if (!searchQuery.trim()) return allHanja;
    const q = searchQuery.trim();
    return allHanja.filter((hanja) => {
      // Prioritize sound matching, but fallback to meaning/char
      return (
        hanja.sound.includes(q) || 
        hanja.meaning.includes(q) ||
        hanja.char.includes(q)
      );
    });
  }, [allHanja, searchQuery]);

  // Fetch traditional character stroke vector data dynamically using Multi-CDN Fallback & Timeout
  useEffect(() => {
    if (!currentHanja) return;
    
    // Tight timeout helper
    const fetchJsonWithTimeout = async (url, timeoutMs = 1200) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (res.ok) {
          const data = await res.json();
          if (data && data.strokes && data.strokes.length > 0) {
            return data;
          }
        }
        throw new Error(`Non-ok response or empty data from ${url}`);
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    // Race helper for multiple CDNs in a tier
    const raceCDNs = (urls, timeoutMs = 1200) => {
      return new Promise((resolve, reject) => {
        let errors = [];
        let completed = 0;
        if (urls.length === 0) reject(new Error('No URLs to race'));
        urls.forEach(url => {
          fetchJsonWithTimeout(url, timeoutMs)
            .then(resolve)
            .catch(err => {
              errors.push(err);
              completed++;
              if (completed === urls.length) {
                reject(new Error('All raced CDNs failed in this tier'));
              }
            });
        });
      });
    };

    const fetchStrokeData = async (character) => {
      const charEncoded = encodeURIComponent(character);

      // Define three sequential tiers of CDNs: jsDelivr, unpkg, and fastly
      const tiers = [
        // Tier 1: Simplified/Standard data
        [
          `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2/${charEncoded}.json`,
          `https://unpkg.com/hanzi-writer-data@2/${charEncoded}.json`
        ],
        // Tier 2: Traditional CJK data
        [
          `https://cdn.jsdelivr.net/npm/hanzi-writer-data-traditional@1.0/${charEncoded}.json`,
          `https://unpkg.com/hanzi-writer-data-traditional@1.0/${charEncoded}.json`
        ],
        // Tier 3: Japanese Kanji data (highly compatible stroke shapes)
        [
          `https://cdn.jsdelivr.net/npm/hanzi-writer-data-jp@latest/${charEncoded}.json`,
          `https://unpkg.com/hanzi-writer-data-jp@latest/${charEncoded}.json`
        ]
      ];

      for (const urls of tiers) {
        try {
          const data = await raceCDNs(urls, 1200);
          return data;
        } catch (e) {
          // Fall through to the next tier of CDNs
        }
      }
      throw new Error('Character not found in any stroke vector database');
    };

    const parseAnimCjkSvg = (xmlText) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'image/svg+xml');
      const paths = doc.querySelectorAll('svg > path');
      
      const strokesMap = {};
      const mediansMap = {};
      
      paths.forEach(path => {
        const id = path.getAttribute('id');
        const clipPath = path.getAttribute('clip-path');
        const d = path.getAttribute('d');
        
        if (id && id.includes('d')) {
          const numMatch = id.match(/d(\d+)$/);
          if (numMatch) {
            const index = parseInt(numMatch[1], 10) - 1;
            strokesMap[index] = d;
          }
        } else if (clipPath && clipPath.includes('c')) {
          const numMatch = clipPath.match(/c(\d+)\)?$/);
          if (numMatch) {
            const index = parseInt(numMatch[1], 10) - 1;
            const coords = [];
            const tokens = d.split(/[MLCSQTZ\s,]+/i).filter(t => t.trim());
            for (let i = 0; i < tokens.length - 1; i += 2) {
              const x = Math.round(parseFloat(tokens[i]));
              const y = Math.round(parseFloat(tokens[i+1]));
              if (!isNaN(x) && !isNaN(y)) {
                coords.push([x, y]);
              }
            }
            mediansMap[index] = coords;
          }
        }
      });
      
      const strokes = [];
      const medians = [];
      const len = Math.max(Object.keys(strokesMap).length, Object.keys(mediansMap).length);
      for (let i = 0; i < len; i++) {
        strokes.push(strokesMap[i] || '');
        medians.push(mediansMap[i] || []);
      }
      
      return { strokes, medians };
    };

    const fetchAnimCjkStrokeData = async (character) => {
      const dec = character.charCodeAt(0);
      const folders = ['svgsZhHans', 'svgsZhHant', 'svgsJa', 'svgsKo'];
      
      for (const folder of folders) {
        const url = `https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master/${folder}/${dec}.svg`;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1200);
        
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          if (res.ok) {
            const xml = await res.text();
            const parsed = parseAnimCjkSvg(xml);
            if (parsed.strokes.length > 0) {
              console.log(`HanjaWriter: Loaded animCJK stroke data for "${character}" from ${folder}`);
              return parsed;
            }
          }
        } catch (e) {
          clearTimeout(id);
        }
      }
      throw new Error('Character not found in animCJK database');
    };

    const loadStrokes = async () => {
      setIsLoadingStrokes(true);
      setStrokeData(null);
      
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      strokeProgressRef.current = 0;
      currentStrokeIndexRef.current = 0;
      isCompletedPauseRef.current = false;
      
      const char = currentHanja.char;
      
      // 1. Normalize unicode compatibility characters (e.g. 金 -> 金)
      let targetChar = char.normalize('NFKC');
      
      // 2. Map specific Korean Hanja variants to standard Traditional/Simplified writer codes
      const HANJA_FALLBACK_MAP = {
        '敎': '教',
        '靑': '青',
        '溫': '温',
        '氷': '冰',
        '强': '強',
        '旣': '既',
        '內': '内',
        '全': '全',
        '兩': '两',
        '黃': '黄',
        '黑': '黑',
        '畫': '画',
        // Failures mapped from failures_mapped.json
        "檟": "槚",
        "榦": "干",
        "鏗": "铿",
        "賡": "赓",
        "硜": "硁",
        "綌": "绤",
        "闋": "阕",
        "熲": "颎",
        "駉": "𬳶",
        "鯀": "鲧",
        "鸛": "鹳",
        "綰": "绾",
        "纊": "纩",
        "磽": "硗",
        "窶": "窭",
        "覯": "觏",
        "詘": "诎",
        "頍": "𫠆",
        "騤": "骙",
        "棊": "棋",
        "旂": "旗",
        "軝": "𬨂",
        "頎": "颀",
        "穠": "秾",
        "闥": "闼",
        "鏜": "镗",
        "闍": "阇",
        "擣": "捣",
        "綯": "绹",
        "櫝": "椟",
        "蝀": "𬟽",
        "倈": "俫",
        "酈": "郦",
        "壚": "垆",
        "虆": "蔂",
        "懍": "懔",
        "禡": "祃",
        "勱": "劢",
        "纆": "𬙊",
        "璊": "𫞩",
        "鉑": "铂",
        "魴": "鲂",
        "籩": "笾",
        "鈇": "𫓧",
        "鮒": "鲋",
        "濆": "𣸣",
        "豶": "豮",
        "紱": "绂",
        "騑": "𬴂",
        "駓": "𬳵",
        "璸": "瑸",
        "儐": "傧",
        "簑": "蓑",
        "鱨": "鲿",
        "諝": "谞",
        "墠": "𫮃",
        "紲": "绁",
        "騂": "骍",
        "繅": "缫",
        "餗": "𫗧",
        "飱": "飧",
        "繻": "𦈡",
        "諟": "𬤊",
        "塒": "埘",
        "鳲": "鸤",
        "釃": "酾",
        "緦": "缌",
        "駪": "𬳽",
        "贐": "赆",
        "諗": "谂",
        "訐": "讦",
        "嚶": "嘤",
        "颺": "飏",
        "鍚": "钖",
        "鷊": "",
        "懌": "怿",
        "饁": "馌",
        "攖": "撄",
        "瘞": "瘗",
        "輗": "𫐐",
        "勩": "勚",
        "鷖": "鹥",
        "汙": "污",
        "韞": "韫",
        "媼": "媪",
        "顒": "颙",
        "騧": "䯄",
        "俁": "俣",
        "訏": "𬣙",
        "騵": "𫘪",
        "軏": "𫐄",
        "煒": "炜",
        "輶": "𬨎",
        "憖": "慭",
        "駰": "骃",
        "訒": "讱",
        "鎡": "镃",
        "鏘": "锵",
        "萇": "苌",
        "賫": "赍",
        "糴": "籴",
        "覿": "觌",
        "闐": "",
        "戩": "戬",
        "赬": "赪",
        "棖": "枨",
        "隮": "𬯀",
        "嚌": "哜",
        "蠐": "蛴",
        "鰷": "鲦",
        "皁": "皂",
        "輈": "辀",
        "譸": "诪",
        "絰": "绖",
        "銍": "铚",
        "瑲": "玱",
        "蠆": "虿",
        "簀": "箦",
        "縐": "绉",
        "賰": "䞐",
        "觶": "觯",
        "絺": "𫄨",
        "駸": "骎",
        "縶": "絷",
        "鮀": "𬶍",
        "蘀": "萚",
        "僤": "𫢸",
        "梲": "棁",
        "隤": "𬯎",
        "諞": "谝",
        "灃": "沣",
        "詖": "诐",
        "鉍": "铋",
        "扞": "捍",
        "諴": "𫍯",
        "巘": "𪩘",
        "獫": "猃",
        "譓": "𬤝",
        "鉷": "𫟹",
        "鐶": "镮",
        "鍰": "锾",
        "頮": "颒",
        "嘵": "哓",
        "餱": "糇",
        "鍭": "𬭤",
        "纁": "𫄸",
        "諼": "谖",
        "翬": "翚",
        "訩": "讻",
        "齕": ""
      };
      
      if (HANJA_FALLBACK_MAP[targetChar]) {
        targetChar = HANJA_FALLBACK_MAP[targetChar];
      }
      
      // 1. Mapped Character - standard CDN JSON
      try {
        console.log(`HanjaWriter: Fetching mapped char "${targetChar}" (original: "${char}") from standard CDNs`);
        const data = await fetchStrokeData(targetChar);
        setStrokeData(data);
        setIsLoadingStrokes(false);
        if (hasStarted) setIsPlaying(true);
        return;
      } catch (err) {
        console.warn(`HanjaWriter: Mapped char "${targetChar}" standard CDNs failed. Trying animCJK SVG...`);
      }

      // 2. Mapped Character - animCJK SVG
      try {
        const data = await fetchAnimCjkStrokeData(targetChar);
        setStrokeData(data);
        setIsLoadingStrokes(false);
        if (hasStarted) setIsPlaying(true);
        return;
      } catch (err) {
        console.warn(`HanjaWriter: Mapped char "${targetChar}" animCJK SVG failed. Trying original "${char}" standard CDNs...`);
      }

      // 3. Original Character - standard CDN JSON
      try {
        const data = await fetchStrokeData(char);
        setStrokeData(data);
        setIsLoadingStrokes(false);
        if (hasStarted) setIsPlaying(true);
        return;
      } catch (err) {
        console.warn(`HanjaWriter: Original char "${char}" standard CDNs failed. Trying original animCJK SVG...`);
      }

      // 4. Original Character - animCJK SVG
      try {
        const data = await fetchAnimCjkStrokeData(char);
        setStrokeData(data);
        setIsLoadingStrokes(false);
        if (hasStarted) setIsPlaying(true);
        return;
      } catch (err) {
        console.error(`HanjaWriter: All stroke fetching strategies failed for "${char}":`, err);
        setStrokeData(null);
        setIsLoadingStrokes(false);
      }
    };

    loadStrokes();
  }, [currentIndex]);

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



  // Handle animation loop
  useEffect(() => {
    if (!hasStarted || !currentHanja || !isPlaying) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const textX = canvasSize / 2;
    const textY = canvasSize / 2 + 10;
    const fontStr = 'bold 150px "AppleMyungjo", "Songti SC", "Songti TC", "Batang", serif';

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

      if (strokeData) {
        // --- 1. SVG-based Realistic Stroke Drawing ---
        const totalStrokes = strokeData.strokes.length;
        const currentStrokeIdx = currentStrokeIndexRef.current;

        // A. Draw light-gray guide outline of the complete Hanja
        ctx.save();
        ctx.scale(canvasSize / 1024, canvasSize / 1024);
        ctx.translate(0, 900);
        ctx.scale(1, -1);
        ctx.fillStyle = 'rgba(226, 232, 240, 0.55)'; // Light gray guide
        strokeData.strokes.forEach((strokeStr) => {
          const path = new Path2D(strokeStr);
          ctx.fill(path);
        });
        ctx.restore();

        // B. Draw all completed strokes in dark slate (#1e293b)
        ctx.save();
        ctx.scale(canvasSize / 1024, canvasSize / 1024);
        ctx.translate(0, 900);
        ctx.scale(1, -1);
        ctx.fillStyle = '#1e293b';
        for (let i = 0; i < currentStrokeIdx; i++) {
          const path = new Path2D(strokeData.strokes[i]);
          ctx.fill(path);
        }
        ctx.restore();

        let brushX = 0;
        let brushY = 0;
        let isBrushActive = false;

        // C. Draw current animating stroke partially
        if (currentStrokeIdx < totalStrokes) {
          ctx.save();
          // Transform coordinates to 1024x1024 space with inverted Y
          ctx.scale(canvasSize / 1024, canvasSize / 1024);
          ctx.translate(0, 900);
          ctx.scale(1, -1);

          // Clip drawing to the outline of the current stroke
          const clipPath = new Path2D(strokeData.strokes[currentStrokeIdx]);
          ctx.clip(clipPath);

          // Draw the thick median line up to progress along the median path
          const medianPoints = strokeData.medians[currentStrokeIdx];
          ctx.beginPath();
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 140; // Thick line width covers the stroke width
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (medianPoints && medianPoints.length > 0) {
            ctx.moveTo(medianPoints[0][0], medianPoints[0][1]);
            
            // Calculate length of median path
            let totalLength = 0;
            const segmentLengths = [];
            for (let j = 1; j < medianPoints.length; j++) {
              const dx = medianPoints[j][0] - medianPoints[j-1][0];
              const dy = medianPoints[j][1] - medianPoints[j-1][1];
              const len = Math.sqrt(dx*dx + dy*dy);
              segmentLengths.push(len);
              totalLength += len;
            }
            
            const targetLength = totalLength * strokeProgressRef.current;
            let currentLength = 0;
            let brushPos = { x: medianPoints[0][0], y: medianPoints[0][1] };
            
            for (let j = 1; j < medianPoints.length; j++) {
              const p1 = medianPoints[j-1];
              const p2 = medianPoints[j];
              const len = segmentLengths[j-1];
              
              if (currentLength + len <= targetLength) {
                ctx.lineTo(p2[0], p2[1]);
                currentLength += len;
                brushPos = { x: p2[0], y: p2[1] };
              } else {
                const remaining = targetLength - currentLength;
                const ratio = remaining / len;
                const targetX = p1[0] + (p2[0] - p1[0]) * ratio;
                const targetY = p1[1] + (p2[1] - p1[1]) * ratio;
                ctx.lineTo(targetX, targetY);
                brushPos = { x: targetX, y: targetY };
                break;
              }
            }
            ctx.stroke();
            
            // Map the brush coordinates back to canvas dimensions
            brushX = brushPos.x * (canvasSize / 1024);
            brushY = (900 - brushPos.y) * (canvasSize / 1024);
            isBrushActive = true;
          }
          
          ctx.restore();

          // Increment progress based on speed multiplier
          strokeProgressRef.current += 0.02 * speed;
          if (strokeProgressRef.current >= 1.0) {
            strokeProgressRef.current = 0;
            currentStrokeIndexRef.current += 1;
          }
        } else {
          // Finished: enter completion pause
          isCompletedPauseRef.current = true;
          pauseTimerRef.current = setTimeout(() => {
            isCompletedPauseRef.current = false;
            currentStrokeIndexRef.current = 0;
            strokeProgressRef.current = 0;
          }, 1800);
        }

        // Draw red brush tip marker at the tip of writing
        if (isBrushActive && isPlaying && !isCompletedPauseRef.current) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(brushX, brushY, 7, 0, Math.PI * 2);
          ctx.fill();
        }

      } else {
        // --- 2. Fallback (Myeongjo Font Mask & Sweep animation) ---
        if (isCompletedPauseRef.current) {
          ctx.save();
          ctx.font = fontStr;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#1e293b';
          ctx.fillText(currentHanja.char, textX, textY);
          ctx.restore();

          if (isPlaying) {
            animationFrameRef.current = requestAnimationFrame(animate);
          }
          return;
        }

        // Light guide
        ctx.save();
        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
        ctx.fillText(currentHanja.char, textX, textY);
        ctx.restore();

        const offscreen = document.createElement('canvas');
        offscreen.width = canvasSize;
        offscreen.height = canvasSize;
        const oCtx = offscreen.getContext('2d');

        oCtx.font = fontStr;
        oCtx.textAlign = 'center';
        oCtx.textBaseline = 'middle';
        oCtx.fillStyle = '#1e293b';
        oCtx.fillText(currentHanja.char, textX, textY);

        const strokesCanvas = document.createElement('canvas');
        strokesCanvas.width = canvasSize;
        strokesCanvas.height = canvasSize;
        const sCtx = strokesCanvas.getContext('2d');

        let brushX = 0;
        let brushY = 0;
        let isBrushActive = false;

        const sweepProgress = strokeProgressRef.current;
        
        if (sweepProgress >= 1.0) {
          isCompletedPauseRef.current = true;
          pauseTimerRef.current = setTimeout(() => {
            isCompletedPauseRef.current = false;
            strokeProgressRef.current = 0;
          }, 1800);
        } else {
          const w2 = canvasSize / 2;
          const h2 = canvasSize / 2;
          
          sCtx.clearRect(0, 0, canvasSize, canvasSize);
          
          // Draw fully revealed regions based on current progress
          if (sweepProgress >= 0.4) {
            sCtx.fillStyle = '#1e293b';
            sCtx.fillRect(0, 0, w2, canvasSize); // Left half fully revealed
          }
          if (sweepProgress >= 0.7) {
            sCtx.fillStyle = '#1e293b';
            sCtx.fillRect(w2, 0, w2, h2); // Top-right fully revealed
          }
          
          // Draw currently sweeping region and compute brush coordinates
          if (sweepProgress < 0.4) {
            // Phase 1: Sweep Left half top-to-bottom
            const p = sweepProgress / 0.4;
            const gradient = sCtx.createLinearGradient(0, 0, 0, canvasSize);
            gradient.addColorStop(0, '#1e293b');
            gradient.addColorStop(Math.min(1, p), '#1e293b');
            gradient.addColorStop(Math.min(1, p + 0.15), 'transparent');
            sCtx.fillStyle = gradient;
            sCtx.fillRect(0, 0, w2, canvasSize);
            
            brushX = w2 / 2 + Math.sin(p * Math.PI * 6) * 15;
            brushY = 20 + (canvasSize - 40) * p;
          } else if (sweepProgress < 0.7) {
            // Phase 2: Sweep Top-Right left-to-right/top-to-bottom
            const p = (sweepProgress - 0.4) / 0.3;
            const gradient = sCtx.createLinearGradient(w2, 0, canvasSize, h2);
            gradient.addColorStop(0, '#1e293b');
            gradient.addColorStop(Math.min(1, p), '#1e293b');
            gradient.addColorStop(Math.min(1, p + 0.15), 'transparent');
            sCtx.fillStyle = gradient;
            sCtx.fillRect(w2, 0, w2, h2);
            
            brushX = (w2 + 20) + (w2 - 40) * p;
            brushY = h2 / 2 + Math.cos(p * Math.PI * 6) * 10;
          } else {
            // Phase 3: Sweep Bottom-Right left-to-right/top-to-bottom
            const p = (sweepProgress - 0.7) / 0.3;
            const gradient = sCtx.createLinearGradient(w2, h2, canvasSize, canvasSize);
            gradient.addColorStop(0, '#1e293b');
            gradient.addColorStop(Math.min(1, p), '#1e293b');
            gradient.addColorStop(Math.min(1, p + 0.15), 'transparent');
            sCtx.fillStyle = gradient;
            sCtx.fillRect(w2, h2, w2, h2);
            
            brushX = (w2 + 20) + (w2 - 40) * p;
            brushY = (h2 + 20) + (h2 - 40) * p;
          }
          
          isBrushActive = true;
          strokeProgressRef.current += 0.005 * speed; // Slightly slower for more natural animation feel
        }

        oCtx.globalCompositeOperation = 'source-in';
        oCtx.drawImage(strokesCanvas, 0, 0);
        ctx.drawImage(offscreen, 0, 0);

        if (isBrushActive && isPlaying && !isCompletedPauseRef.current) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(brushX, brushY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
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
  }, [currentIndex, hasStarted, isPlaying, speed, strokeData]);

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
        minHeight: '650px',
        maxWidth: '750px',
        margin: '0 auto',
        padding: '24px 16px',
        textAlign: 'center',
        gap: '20px',
        boxSizing: 'border-box'
      }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 2rem)', color: 'var(--color-primary)', marginBottom: '8px', fontWeight: 'bold', whiteSpace: 'nowrap', wordBreak: 'keep-all', letterSpacing: '-0.5px' }}>
            한자쓰기 연습 (전체 급수)
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '8px' }}>
            아래 배정한자 중 획순 애니메이션을 보고 싶은 한자를 클릭하세요.<br/>
            선택한 한자의 쓰는 법이 즉시 화면에 재생됩니다.
          </p>
        </div>

        {/* TTS Toggle Button on Start Screen */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', width: '100%' }}>
          <button
            onClick={onToggleSound}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--color-border)',
              backgroundColor: '#ffffff',
              color: 'var(--color-text-muted)',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {soundOn ? (
              <>
                <Volume2 size={14} style={{ color: 'var(--color-primary)' }} />
                <span>TTS 켜짐</span>
              </>
            ) : (
              <>
                <VolumeX size={14} style={{ color: '#ef4444' }} />
                <span>TTS 꺼짐</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Search Bar (by Sound/Pronunciation) */}
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="한글 음 검색 (예: 천, 가, 일)"
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '24px',
              border: '2.5px solid var(--color-border)',
              outline: 'none',
              fontSize: '0.95rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s',
              backgroundColor: '#ffffff',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.boxShadow = 'var(--shadow-sm)';
            }}
          />
        </div>

        {/* Grid Selection of Hanja */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
          gap: '8px',
          width: '100%',
          maxHeight: '420px',
          overflowY: 'auto',
          padding: '12px',
          boxSizing: 'border-box',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          scrollBehavior: 'smooth'
        }}>
          {filteredHanja.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              검색된 한자가 없습니다.
            </div>
          ) : (
            filteredHanja.map((hanja) => {
              const origIdx = allHanja.findIndex((h) => h.char === hanja.char);
              return (
                <button
                  key={hanja.char}
                  onClick={() => {
                    unlockTtsAudio();
                    setCurrentIndex(origIdx !== -1 ? origIdx : 0);
                    initialSpeakTriggeredRef.current = true;
                    setHasStarted(true);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', fontFamily: 'serif' }}>
                    {hanja.char}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                    {hanja.sound}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <button onClick={onBack} className="theme-btn" style={{ marginTop: '10px', fontSize: '0.95rem', padding: '8px 24px' }}>
          급수 선택 목록으로 돌아가기
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
        <button onClick={() => setHasStarted(false)} className="theme-btn" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '0.85rem'
        }}>
          <ArrowLeft size={14} /> 목록
        </button>
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
          {currentHanja?.levelOrigin || level} 쓰기 연습 ({currentIndex + 1} / {allHanja.length})
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
          
          {/* Loading overlay */}
          {isLoadingStrokes && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(248, 250, 252, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              color: 'var(--color-primary)',
              fontWeight: 'bold'
            }}>
              획순 데이터 로딩 중...
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
