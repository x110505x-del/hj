import React, { useState, useEffect } from 'react';
import { Award, Trophy, Users, RefreshCw } from 'lucide-react';
import { getLeaderboard } from '../services/mockDb';

export default function Leaderboard({ profile }) {
  const [boardData, setBoardData] = useState([]);

  const refreshData = () => {
    setBoardData(getLeaderboard());
  };

  useEffect(() => {
    refreshData();
    // Refresh periodically
    const timer = setInterval(refreshData, 15000);
    return () => clearInterval(timer);
  }, [profile.xp]);

  return (
    <div style={{ maxWidth: '550px', margin: '30px auto', width: '100%', padding: '0 20px' }}>
      <div className="glass-card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid var(--color-border)',
          paddingBottom: '12px'
        }}>
          <h3 className="font-display" style={{
            fontSize: '1.4rem',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Trophy size={22} fill="var(--color-gold)" style={{ color: 'var(--color-gold)' }} />
            조선 팔도 한자 수련 랭킹
          </h3>
          <button 
            onClick={refreshData}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          💡 학습을 진행하여 획득한 누적 경험치(XP) 기준 실시간 랭킹입니다. 
          경쟁 수련자들도 실시간으로 정진하며 순위가 수시로 바뀝니다!
        </p>

        {/* List of Rankers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {boardData.map((item, idx) => {
            const isUser = item.isUser;
            const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;

            return (
              <div
                key={item.username}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--border-radius-md)',
                  border: isUser 
                    ? '3px solid var(--color-primary)' 
                    : '1px solid var(--color-border)',
                  background: isUser
                    ? (profile.mode === 'kids' ? '#fffbeb' : 'rgba(99, 102, 241, 0.15)')
                    : 'var(--bg-card)',
                  boxShadow: isUser ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  transform: isUser ? 'scale(1.02)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Rank number / medal */}
                  <span style={{
                    width: '30px',
                    textAlign: 'center',
                    fontSize: idx < 3 ? '1.4rem' : '1rem',
                    fontWeight: 'bold',
                    color: 'var(--color-text-muted)'
                  }}>
                    {rankIcon}
                  </span>

                  {/* Profile Name & Title */}
                  <div>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                      color: isUser ? 'var(--color-primary)' : 'var(--color-text-main)'
                    }}>
                      {item.username}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px'
                    }}>
                      <Award size={12} />
                      <span>{item.rankName}</span>
                    </div>
                  </div>
                </div>

                {/* XP display */}
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  <span style={{ fontSize: '1.1rem', color: 'var(--color-secondary)' }}>{item.xp}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '2px' }}>XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
