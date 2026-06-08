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
  }, [profile.gold]);

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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)'}
          >
            <RefreshCw size={11} /> 새로고침
          </button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
          💡 조선 팔도 전역의 수련생들과 누적 골드 획득량을 경쟁하는 실시간 랭킹입니다. 
          학습과 도전 과제를 완수하고, 나보다 순위가 높은 라이벌들을 추월하여 1위를 탈환해 보세요!
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
                  key={item.username}
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
