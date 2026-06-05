import React, { useState } from 'react';
import { Coins, Calendar, ShieldCheck } from 'lucide-react';
import { buyItem, restoreStreak } from '../services/mockDb';

export default function Shop({ profile, onUpdateProfile }) {
  const [feedback, setFeedback] = useState('');
  const ticketCount = profile.inventory.filter(item => item === 'streak_restoration_ticket').length;

  const handleBuyItem = (itemId) => {
    const res = buyItem(itemId);
    setFeedback(res.message);
    
    // Auto clear feedback after 3 seconds
    setTimeout(() => setFeedback(''), 3000);
    
    // Refresh profile state
    if (res.success) {
      const updated = {
        ...profile,
        gold: profile.gold - 150,
        inventory: [...profile.inventory, 'streak_restoration_ticket']
      };
      
      onUpdateProfile(updated);
    }
  };

  const handleRestoreStreak = () => {
    const res = restoreStreak();
    setFeedback(res.message);
    setTimeout(() => setFeedback(''), 3500);

    if (res.success) {
      const updated = {
        ...profile,
        // Re-read inventory
        inventory: profile.inventory.filter((_, idx) => idx !== profile.inventory.indexOf('streak_restoration_ticket')),
        streak: Math.max(profile.streak, 3) + 2 // Matches mockDb.js sync logic
      };
      onUpdateProfile(updated);
    }
  };

  return (
    <div style={{ maxWidth: '550px', margin: '30px auto', width: '100%', padding: '0 20px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
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
            🛒 한자 상점 & 아이템 보관함
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 'bold',
            color: 'var(--color-gold)',
            fontSize: '1.05rem'
          }}>
            <Coins size={18} fill="currentColor" />
            <span>내 잔액: {profile.gold}G</span>
          </div>
        </div>

        {feedback && (
          <div style={{
            background: 'var(--bg-app)',
            border: '1px dashed var(--color-primary)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '12px',
            marginBottom: '16px',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: 'var(--color-text-main)'
          }}>
            {feedback}
          </div>
        )}

        {/* Inventory Bag Section */}
        <div style={{
          background: 'var(--bg-app)',
          padding: '16px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          marginBottom: '24px'
        }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', marginBottom: '10px' }}>
            💼 내가 보유한 보관함
          </h4>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 'var(--border-radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>수련 기록 복구권</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>보유 수량: {ticketCount}장</div>
              </div>
            </div>

            <button
              className="theme-btn theme-btn-primary"
              onClick={handleRestoreStreak}
              disabled={ticketCount === 0}
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                opacity: ticketCount === 0 ? 0.5 : 1
              }}
            >
              사용하기
            </button>
          </div>
        </div>

        {/* Store Shelf Items */}
        <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>🛍️ 구매 가능한 상품</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Shop Item 1: Streak Restorer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '70%' }}>
              <div style={{ fontSize: '2rem' }}>🎫</div>
              <div>
                <h5 className="font-display" style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }}>수련 기록 복구권</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  하루 공부를 깜빡해 연속 학습 기록(수련일)이 끊겼을 때 사용하여 복구합니다. (주 1회 제한)
                </p>
              </div>
            </div>

            <button
              className="theme-btn theme-btn-primary"
              onClick={() => handleBuyItem('streak_restorer')}
              style={{
                padding: '10px 14px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>150G</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
