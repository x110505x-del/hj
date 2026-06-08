import React, { useState, useEffect } from 'react';
import { Award, Trophy, Users, RefreshCw, Loader2 } from 'lucide-react';
import { fetchGlobalLeaderboard } from '../services/dbSync';

// Simple hashing function to obfuscate the email address for privacy (matching dbSync.js)
function obfuscateEmail(email) {
  if (!email) return 'anon';
  const cleanEmail = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    const char = cleanEmail.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'usr_' + Math.abs(hash);
}

export default function Leaderboard({ profile }) {
  const [boardData, setBoardData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGlobalLeaderboard();
      const myId = profile.isLoggedIn && profile.email ? obfuscateEmail(profile.email) : '';

      // ⚠️ CRITICAL GUARDRAIL: Match by hashed email ID (myId) instead of nickname.
      // - Relying only on username causes duplicate entries if the user edits their nickname.
      let mapped = data.map(u => {
        const isUser = profile.isLoggedIn && (
          (u.id && u.id === myId) || 
          (u.username === profile.username)
        );

        if (isUser) {
          return {
            ...u,
            username: profile.username, // Force latest nickname from local state
            gold: profile.gold,
            xp: profile.xp,
            isUser: true
          };
        }
        return {
          ...u,
          isUser: false
        };
      });

      // Filter out duplicate legacy entries of the same user if any existed under old matching rules
      if (myId) {
        const seenUsernames = new Set();
        const seenIds = new Set();
        mapped = mapped.filter(u => {
          if (u.isUser) {
            seenUsernames.add(u.username);
            if (u.id) seenIds.add(u.id);
            return true;
          }
          if (seenUsernames.has(u.username)) return false;
          if (u.id && seenIds.has(u.id)) return false;
          return true;
        });
      }

      // If the logged in user is not yet in the global leaderboard array from the server,
      // optimistically inject them so they see themselves instantly.
      const hasUserInBoard = mapped.some(u => u.isUser);
      if (profile.isLoggedIn && !hasUserInBoard) {
        let rName = '유생 (儒生)';
        if (profile.xp >= 1500) rName = '진사 (進士)';
        if (profile.xp >= 3500) rName = '장원급제 (壯元及第)';
        if (profile.xp >= 6000) rName = '한림학사 (翰林學士)';
        if (profile.xp >= 10000) rName = '대제학 (大提學)';

        mapped.push({
          id: myId,
          username: profile.username,
          gold: profile.gold,
          xp: profile.xp,
          rankName: rName,
          isUser: true
        });
      }

      // Re-sort the combined board based on updated gold values
      mapped.sort((a, b) => b.gold - a.gold);
      setBoardData(mapped);
    } catch (e) {
      console.warn(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
    // Refresh periodically
    const timer = setInterval(refreshData, 30000);
    return () => clearInterval(timer);
  }, [profile.gold, profile.username]);

  return (
    <div style={{ width: '100%', marginTop: '24px' }}>
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px',
          borderBottom: '2px solid var(--color-border)',
          paddingBottom: '8px'
        }}>
          <h3 className="font-display" style={{
            fontSize: '1.1rem',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: 0
          }}>
            <Trophy size={18} fill="var(--color-gold)" style={{ color: 'var(--color-gold)' }} />
            조선 팔도 한자 수련 랭킹
          </h3>
          <button 
            onClick={refreshData}
            style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '20px',
              padding: '4px 8px',
              color: 'var(--color-primary)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => { if(!isLoading) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)' }}
            onMouseLeave={(e) => { if(!isLoading) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)' }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={11} />} 새로고침
          </button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
          💡 오직 실제로 가입하여 정진 중인 전국의 진짜 수련생들만 기록되는 실시간 글로벌 랭킹입니다. 
          꾸준한 학습으로 골드를 획득하고 진짜 수련생들 사이에서 순위를 높여 보세요!
        </p>

        {/* List of Rankers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {boardData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              아직 랭킹에 등록된 수련생이 없습니다. 로그인을 진행해 주세요!
            </div>
          ) : (
            boardData.map((item, idx) => {
              const isUser = item.isUser;
              const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;

              return (
                <div
                  key={`${item.username || 'user'}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--border-radius-md)',
                    border: isUser 
                      ? '2px solid var(--color-primary)' 
                      : '1px solid var(--color-border)',
                    background: isUser
                      ? (profile?.mode === 'kids' ? '#fffbeb' : 'rgba(99, 102, 241, 0.08)')
                      : 'var(--bg-card)',
                    boxShadow: isUser ? 'var(--shadow-sm)' : 'none',
                    transform: isUser ? 'scale(1.01)' : 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Rank number / medal */}
                    <span style={{
                      width: '24px',
                      textAlign: 'center',
                      fontSize: idx < 3 ? '1.15rem' : '0.85rem',
                      fontWeight: 'bold',
                      color: 'var(--color-text-muted)'
                    }}>
                      {rankIcon}
                    </span>

                    {/* Profile Name & Title */}
                    <div>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        color: isUser ? 'var(--color-primary)' : 'var(--color-text-main)'
                      }}>
                        {item.username} {isUser && <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 'normal' }}>(나)</span>}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        marginTop: '1px'
                      }}>
                        <Award size={10} />
                        <span>{item.rankName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gold display */}
                  <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '0.95rem', color: '#d97706' }}>{item.gold}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '2px' }}>G</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
