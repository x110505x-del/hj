// Mock Database Service for Hanja Master

// Joseon Dynasty Ranks based on XP
export const RANKS = [
  { name: '유생 (儒生)', minXp: 0, description: '가입 초기 학습을 막 시작한 초보 학습자 단계' },
  { name: '진사 (進士)', minXp: 500, description: '일정 기준 이상의 한자 학습을 이수하고 기본 XP를 획득한 단계' },
  { name: '장원급제 (壯元及第)', minXp: 1500, description: '중급 난이도를 정복하고 랭킹 상위권에 도달한 단계' },
  { name: '한림학사 (翰林學士)', minXp: 3000, description: '고급 급수 진입 및 실시간 랭킹 상위 백분율을 유지하는 고숙련 단계' },
  { name: '대제학 (大提學)', minXp: 6000, description: '최고 등급의 한자(1급/특급)를 완벽히 정복한 최고 명예 등급' }
];

export function getRankByXp(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXp) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

// Hanja Data with normalized 100x100 coordinates for stroke checking
export const HANJA_DATA = {
  '8급': [
    {
      id: 'dae',
      char: '大',
      sound: '대',
      meaning: '큰',
      example: '대문 (大門), 대학교 (大學校)',
      principle: '사람(人)이 팔다리를 활짝 벌리고 서 있는 모양을 본떠 만든 글자로, 크다를 뜻합니다.',
      level: '8급',
      strokes: [
        [[20, 40], [80, 40]], // Stroke 1: Horizontal line
        [[50, 20], [50, 40], [20, 80]], // Stroke 2: Left slant curve
        [[50, 40], [80, 80]]  // Stroke 3: Right slant
      ]
    },
    {
      id: 'cheon',
      char: '天',
      sound: '천',
      meaning: '하늘',
      example: '천국 (天國), 천사 (天使)',
      principle: '사람(大)의 머리 위에 넓게 펼쳐진 하늘(一)을 나타낸 글자입니다.',
      level: '8급',
      strokes: [
        [[30, 25], [70, 25]], // Stroke 1: Short horizontal line
        [[20, 45], [80, 45]], // Stroke 2: Long horizontal line
        [[50, 25], [50, 45], [20, 85]], // Stroke 3: Left slant curve
        [[50, 45], [80, 85]]  // Stroke 4: Right slant
      ]
    },
    {
      id: 'in',
      char: '人',
      sound: '인',
      meaning: '사람',
      example: '인간 (人間), 인품 (人品)',
      principle: '두 사람이 서로 의지하며 서 있는 옆모습을 본떠 만든 글자입니다.',
      level: '8급',
      strokes: [
        [[50, 20], [20, 80]], // Stroke 1: Left slant
        [[35, 50], [80, 80]]  // Stroke 2: Right slant connecting to the first stroke
      ]
    },
    {
      id: 'mok',
      char: '木',
      sound: '목',
      meaning: '나무',
      example: '목수 (木手), 목재 (木재)',
      principle: '땅 아래로 뻗은 뿌리와 위로 뻗은 가지가 있는 나무의 모양을 본떠 만든 글자입니다.',
      level: '8급',
      strokes: [
        [[20, 35], [80, 35]], // Stroke 1: Horizontal line
        [[50, 15], [50, 85]], // Stroke 2: Vertical line
        [[50, 35], [20, 75]], // Stroke 3: Left slant
        [[50, 35], [80, 75]]  // Stroke 4: Right slant
      ]
    },
    {
      id: 'su',
      char: '水',
      sound: '수',
      meaning: '물',
      example: '수영 (水泳), 수질 (水質)',
      principle: '가운데 물줄기가 굽이쳐 흐르고 좌우에 물방울이 튀는 모습을 표현한 글자입니다.',
      level: '8급',
      strokes: [
        [[50, 15], [50, 70], [40, 80], [35, 75]], // Stroke 1: Middle hook vertical
        [[25, 40], [45, 40]], // Stroke 2: Left top short curve
        [[20, 75], [45, 60]], // Stroke 3: Left bottom line
        [[55, 35], [80, 75]]  // Stroke 4: Right slant
      ]
    }
  ],
  '7급': [
    {
      id: 'san',
      char: '山',
      sound: '산',
      meaning: '뫼',
      example: '등산 (登山), 산맥 (山脈)',
      principle: '솟아오른 세 개의 봉우리를 가진 산의 모양을 본떠 만든 글자입니다.',
      level: '7급',
      strokes: [
        [[50, 15], [50, 80]], // Stroke 1: Middle vertical
        [[25, 45], [25, 80], [75, 80]], // Stroke 2: Left hook bottom horizontal
        [[75, 45], [75, 80]]  // Stroke 3: Right vertical
      ]
    },
    {
      id: 'gu',
      char: '口',
      sound: '구',
      meaning: '입',
      example: '출구 (出口), 입구 (入口)',
      principle: '음식을 먹거나 말을 하는 벌린 입의 동그란(네모난) 모양을 본뜬 글자입니다.',
      level: '7급',
      strokes: [
        [[25, 25], [25, 75]], // Stroke 1: Left vertical
        [[25, 25], [75, 25], [75, 75]], // Stroke 2: Top-right corner
        [[25, 75], [75, 75]]  // Stroke 3: Bottom horizontal
      ]
    },
    {
      id: 'su_hand',
      char: '手',
      sound: '수',
      meaning: '손',
      example: '박수 (拍手), 악수 (握手)',
      principle: '손목과 다섯 손가락을 활짝 핀 모양을 본뜬 글자입니다.',
      level: '7급',
      strokes: [
        [[70, 15], [30, 25]], // Stroke 1: Top horizontal slash (right to left)
        [[25, 40], [75, 40]], // Stroke 2: Middle horizontal line
        [[20, 60], [80, 60]], // Stroke 3: Long horizontal line
        [[50, 20], [50, 80], [40, 85]] // Stroke 4: Center vertical hook
      ]
    }
  ],
  '준6급': [
    {
      id: 'jung',
      char: '中',
      sound: '중',
      meaning: '가운데',
      example: '중국 (中國), 가운데 (중)',
      principle: '네모진 사각 과녁 한가운데에 화살 대가 위아래로 꿰뚫고 있는 모습을 형상화하여 "가운데"를 뜻합니다.',
      level: '준6급',
      strokes: [
        [[30, 30], [30, 70]], // Stroke 1: Left vertical
        [[30, 30], [70, 30], [70, 70]], // Stroke 2: Top and Right
        [[30, 70], [70, 70]], // Stroke 3: Bottom line
        [[50, 15], [50, 85]]  // Stroke 4: Center piercing vertical
      ]
    },
    {
      id: 'han',
      char: '漢',
      sound: '한',
      meaning: '한나라',
      example: '한자 (漢字), 한강 (漢江)',
      principle: '물 수(氵) 변과 진흙 황(𦰩)이 합쳐져 큰 물이나 강을 나타내며, 훗날 한나라를 의미하게 되었습니다.',
      level: '준6급',
      strokes: [
        [[25, 25], [30, 30]], // Stroke 1: Dot (water)
        [[25, 45], [30, 50]], // Stroke 2: Second dot
        [[20, 75], [35, 65]], // Stroke 3: Rise stroke
        [[45, 20], [80, 20]], // Stroke 4: Top horizontal
        [[60, 20], [60, 35]], // Stroke 5: Vertical
        [[40, 35], [85, 35]], // Stroke 6: Second horizontal
        [[40, 55], [85, 55]], // Stroke 7: Third horizontal
        [[50, 35], [50, 75]], // Stroke 8: Left inner vertical
        [[75, 35], [75, 75]], // Stroke 9: Right inner vertical
        [[45, 75], [80, 75]], // Stroke 10: Bottom horizontal
        [[62, 55], [45, 90]], // Stroke 11: Left leg slash
        [[62, 75], [85, 90]]  // Stroke 12: Right leg slash
      ]
    }
  ]
};

const DEFAULT_PROFILE = {
  username: '초보 수련자',
  isLoggedIn: false,
  email: '',
  role: 'user', // 'user' | 'admin'
  mode: 'general', 
  voice: 'pro-announcer', 
  xp: 0,
  gold: 200,
  hearts: 5,
  streak: 0,
  streakLastActive: null,
  goal: '8급',
  inventory: [],
  wrongCount: {},
  mastered: [],
  currentLevel: '8급',
  soundOn: true
};

const MOCK_COMPETITORS = [
  { username: '퇴계 이황', xp: 5800, rankName: '한림학사 (翰林學士)', goal: '준6급' },
  { username: '율곡 이이', xp: 4200, rankName: '한림학사 (翰林學士)', goal: '준6급' },
  { username: '신사임당', xp: 2600, rankName: '장원급제 (壯元及第)', goal: '7급' },
  { username: '집현전 장영실', xp: 1200, rankName: '진사 (進士)', goal: '8급' },
  { username: '방랑시인 김삿갓', xp: 450, rankName: '유생 (儒生)', goal: '8급' }
];

const INITIAL_FEEDBACKS = [
  {
    id: 'f1',
    category: '기술적 오류',
    title: '모바일 환경에서 캔버스 터치 인식이 간헐적으로 끊깁니다.',
    body: '사파리 브라우저에서 스크롤을 내리다 터치 드래그를 시도하면 캔버스 그리기 선이 끊깁니다.',
    author: '어려운한자',
    createdAt: '2026-06-01',
    reply: '안녕하세요. iOS 터치 스크롤 방지 로직(touch-action: none)이 누락된 버그가 확인되어 긴급 패치하였습니다. 이용에 불편을 드려 죄송합니다.'
  },
  {
    id: 'f2',
    category: '기능 건의',
    title: '1급 배정한자도 추가해주실 수 있나요?',
    body: '수준별 8급부터 준6급까지 있는데 나중에는 1급 한자도 복습할 수 있는 기능이 있으면 정말 좋겠습니다.',
    author: '선비지망생',
    createdAt: '2026-06-02',
    reply: null
  }
];

export const getProfile = () => {
  const data = localStorage.getItem('hanja_profile');
  if (!data) {
    localStorage.setItem('hanja_profile', JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }
  const profile = JSON.parse(data);
  return { ...DEFAULT_PROFILE, ...profile };
};

export const saveProfile = (profile) => {
  localStorage.setItem('hanja_profile', JSON.stringify(profile));
  window.dispatchEvent(new Event('profileUpdated'));
};

// --- FEEDBACK DATABASE CONTROLLERS ---

export const getFeedbackList = () => {
  const data = localStorage.getItem('hanja_feedbacks');
  if (!data) {
    localStorage.setItem('hanja_feedbacks', JSON.stringify(INITIAL_FEEDBACKS));
    return INITIAL_FEEDBACKS;
  }
  return JSON.parse(data);
};

export const createFeedback = (category, title, body, author) => {
  const feedbacks = getFeedbackList();
  const newFeedback = {
    id: 'f_' + Date.now(),
    category,
    title,
    body,
    author: author || '익명',
    createdAt: new Date().toISOString().split('T')[0],
    reply: null
  };
  
  feedbacks.unshift(newFeedback);
  localStorage.setItem('hanja_feedbacks', JSON.stringify(feedbacks));
  return newFeedback;
};

export const addFeedbackReply = (feedbackId, replyText) => {
  const feedbacks = getFeedbackList();
  const index = feedbacks.findIndex(item => item.id === feedbackId);
  
  if (index !== -1) {
    feedbacks[index].reply = replyText;
    localStorage.setItem('hanja_feedbacks', JSON.stringify(feedbacks));
    return { success: true, feedback: feedbacks[index] };
  }
  return { success: false, message: '글을 찾을 수 없습니다.' };
};

// --- ADMIN USERS AUDIT ---
export const getAdminUsersList = () => {
  // Combine current profile status with other mock accounts
  const profile = getProfile();
  const rank = getRankByXp(profile.xp);
  
  const userRow = {
    username: profile.username,
    email: profile.email || 'guest@hanja.com',
    xp: profile.xp,
    streak: profile.streak,
    goal: profile.goal,
    currentLevel: profile.currentLevel,
    rankName: rank.name,
    role: profile.role
  };

  const list = [
    userRow,
    { username: '어려운한자', email: 'hardhanja@naver.com', xp: 6200, streak: 12, goal: '준6급', currentLevel: '준6급', rankName: '대제학 (大提學)', role: 'user' },
    { username: '선비지망생', email: 'scholar@daum.net', xp: 1850, streak: 8, goal: '7급', currentLevel: '7급', rankName: '장원급제 (壯元及第)', role: 'user' },
    { username: '한자천재', email: 'genius12@gmail.com', xp: 550, streak: 3, goal: '8급', currentLevel: '8급', rankName: '진사 (進士)', role: 'user' }
  ];

  return list;
};

// Update Streak daily check-in logic
export const checkIn = () => {
  const profile = getProfile();
  const today = new Date().toISOString().split('T')[0];
  
  if (profile.streakLastActive === today) {
    return { success: false, message: '오늘 이미 학습 출석을 완료했습니다!' };
  }

  let streak = profile.streak;
  let message = '';
  
  if (profile.streakLastActive) {
    const lastDate = new Date(profile.streakLastActive);
    const todayDate = new Date(today);
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak += 1;
      message = `연속 ${streak}일 학습 체크인 성공! 🔥`;
    } else if (diffDays > 1) {
      streak = 1;
      message = `학습 기록이 끊겼습니다. 새로 1일차 학습을 시작합니다! (수련 복구권을 상점에서 구매해 복구할 수 있습니다)`;
    }
  } else {
    streak = 1;
    message = '첫 학습 기록을 등록하셨습니다. 정진하십시오! 🚀';
  }
  
  profile.streak = streak;
  profile.streakLastActive = today;
  profile.gold += 50;
  profile.xp += 30;
  
  saveProfile(profile);
  return { success: true, streak, goldBonus: 50, xpBonus: 30, message };
};

export const getLeaderboard = () => {
  const profile = getProfile();
  const currentRank = getRankByXp(profile.xp);
  
  const userEntry = {
    username: profile.username + ' (나)',
    xp: profile.xp,
    rankName: currentRank.name,
    isUser: true
  };
  
  const now = Date.now();
  const lastUpdate = localStorage.getItem('competitors_last_update');
  let competitors = MOCK_COMPETITORS;
  
  const savedCompetitors = localStorage.getItem('competitors_data');
  if (savedCompetitors) {
    competitors = JSON.parse(savedCompetitors);
  }
  
  if (!lastUpdate || now - parseInt(lastUpdate) > 60000) {
    competitors = competitors.map(comp => {
      const addedXp = Math.floor(Math.random() * 15);
      const newXp = comp.xp + addedXp;
      return {
        ...comp,
        xp: newXp,
        rankName: getRankByXp(newXp).name
      };
    });
    localStorage.setItem('competitors_data', JSON.stringify(competitors));
    localStorage.setItem('competitors_last_update', now.toString());
  }
  
  const combined = [...competitors, userEntry];
  combined.sort((a, b) => b.xp - a.xp);
  
  return combined;
};

// Purchase shop items
export const buyItem = (itemId) => {
  const profile = getProfile();
  
  if (itemId === 'streak_restorer') {
    const price = 150;
    if (profile.gold < price) {
      return { success: false, message: '골드가 부족합니다! (필요 골드: 150)' };
    }
    
    const lastRestore = localStorage.getItem('last_streak_restore_date');
    const today = new Date().toISOString().split('T')[0];
    if (lastRestore === today) {
      return { success: false, message: '수련 복구권은 하루 1회만 구매할 수 있습니다.' };
    }
    
    profile.gold -= price;
    profile.inventory.push('streak_restoration_ticket');
    saveProfile(profile);
    return { success: true, message: '수련 기록 복구권을 구매했습니다! 🎫' };
  }
  
  return { success: false, message: '존재하지 않거나 구매할 수 없는 아이템입니다.' };
};

// Use Streak Restoration Ticket
export const restoreStreak = () => {
  const profile = getProfile();
  const ticketIndex = profile.inventory.indexOf('streak_restoration_ticket');
  
  if (ticketIndex === -1) {
    return { success: false, message: '보유 중인 수련 기록 복구권이 없습니다!' };
  }
  
  profile.inventory.splice(ticketIndex, 1);
  profile.streak = Math.max(profile.streak, 3) + 2;
  const today = new Date().toISOString().split('T')[0];
  profile.streakLastActive = today;
  
  localStorage.setItem('last_streak_restore_date', today);
  saveProfile(profile);
  return { success: true, message: `수련 기록 복구 완료! 현재 연속 수련일: ${profile.streak}일` };
};

// Update learning stats
export const updateAnswerStats = (charId, isCorrect, levelId) => {
  const profile = getProfile();
  const wrongCount = profile.wrongCount || {};
  
  if (isCorrect) {
    if (wrongCount[charId]) {
      wrongCount[charId] = Math.max(0, wrongCount[charId] - 1);
    }
    if (!profile.mastered.includes(charId)) {
      profile.mastered.push(charId);
    }
    profile.xp += 10;
    profile.gold += 5;
  } else {
    wrongCount[charId] = (wrongCount[charId] || 0) + 1;
    profile.hearts = Math.max(0, profile.hearts - 1);
    profile.xp += 2;
  }
  
  profile.wrongCount = wrongCount;
  saveProfile(profile);
  return profile;
};

export const awardActiveStudyXp = () => {
  const profile = getProfile();
  profile.xp += 15;
  saveProfile(profile);
  return 15;
};
