// Joseon Dynasty 8-tier Ranks based on XP and Streak criteria
export const RANKS = [
  { name: '서당 학도', minXp: 0, minStreak: 0, badge: '📝', description: '이제 막 붓을 잡은 초보' },
  { name: '향시 통과', minXp: 200, minStreak: 1, badge: '📜', description: '지방 시험을 합격한 유망주' },
  { name: '진사', minXp: 600, minStreak: 3, badge: '🎓', description: '소과에 합격하여 성균관에 입학한 엘리트' },
  { name: '장원급제', minXp: 1200, minStreak: 5, badge: '🏆', description: '대과에서 당당히 수석을 차지함' },
  { name: '사관', minXp: 2000, minStreak: 7, badge: '✍️', description: '궁궐의 역사를 기록하는 예리한 붓' },
  { name: '한림학사', minXp: 3500, minStreak: 10, badge: '📚', description: '왕의 자문에 응하는 최고의 문장가' },
  { name: '판서', minXp: 5500, minStreak: 14, badge: '👑', description: '조정의 핵심 부처를 이끄는 장관' },
  { name: '영의정', minXp: 8000, minStreak: 20, badge: '🌟', description: '학문과 정점의 마스터 (또는 대제학)' }
];

export function getRankByXp(xp, streak = 0) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXp && streak >= RANKS[i].minStreak) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}
