// Joseon Dynasty 8-tier Ranks based on XP and Streak criteria
export const RANKS = [
  { name: '유생 (儒生)', minXp: 0, minStreak: 0, description: '수련원에 입소하여 붓을 막 쥐기 시작한 초학자 단계' },
  { name: '훈장 (訓長)', minXp: 200, minStreak: 1, description: '한자의 모양과 기초 획순을 익히고 학동들을 이끄는 학습 보조 단계' },
  { name: '진사 (進士)', minXp: 600, minStreak: 3, description: '기초 급수의 한자를 정복하고 과거 시험 예비 단계에 돌입한 유생' },
  { name: '생원 (生員)', minXp: 1200, minStreak: 5, description: '중급 수련 과정을 성공적으로 진행하며 문장 해독력을 키운 현장 학습가' },
  { name: '장원급제 (壯元及第)', minXp: 2000, minStreak: 7, description: '수련 과정을 마스터하고 과거 시험에서 수석으로 합격한 자랑스러운 영예' },
  { name: '한림학사 (翰林學士)', minXp: 3500, minStreak: 10, description: '최고 급수 시험을 대비하며 학문 연구와 수련을 이어가는 학자' },
  { name: '판서 (判書)', minXp: 5500, minStreak: 14, description: '한자 수련의 깊은 경지에 도달하여 한 부처를 이끄는 고결한 고관대작' },
  { name: '대제학 (大提學)', minXp: 8000, minStreak: 20, description: '모든 한자의 극의와 훈음을 완전히 깨달은 왕실 학술원 최고 수장' }
];

export function getRankByXp(xp, streak = 0) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXp && streak >= RANKS[i].minStreak) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}
