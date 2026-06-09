import React, { useState, useEffect } from 'react';
import { Shield, Users, MessageSquare, BarChart3, Reply, Award, CheckCircle2, ChevronRight, Megaphone } from 'lucide-react';
import { getFeedbackList, addFeedbackReply } from '../services/mockDb';
import { getCloudAdminUsersList, fetchGlobalNotice, updateGlobalNotice } from '../services/dbSync';

export default function AdminPanel({ profile }) {
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [globalNoticeText, setGlobalNoticeText] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');

  const loadData = async () => {
    const userList = await getCloudAdminUsersList();
    setUsers(userList);
    setFeedbacks(getFeedbackList());
    if (userList.length > 0) {
      setSelectedUser(userList[0]);
    }
    
    const notice = await fetchGlobalNotice();
    if (notice && notice.isVisible) {
      setGlobalNoticeText(notice.text);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleSaveNotice = async () => {
    if (!globalNoticeText.trim()) {
      setNoticeMsg('공지 내용을 입력해주세요.');
      return;
    }
    const success = await updateGlobalNotice({ text: globalNoticeText.trim(), isVisible: true });
    if (success) {
      setNoticeMsg('전체 공지가 메인 화면에 적용되었습니다! 📢');
      setTimeout(() => setNoticeMsg(''), 3000);
    } else {
      setNoticeMsg('적용 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteNotice = async () => {
    const success = await updateGlobalNotice({ text: '', isVisible: false });
    if (success) {
      setGlobalNoticeText('');
      setNoticeMsg('전체 공지가 삭제(숨김) 되었습니다! 🔇');
      setTimeout(() => setNoticeMsg(''), 3000);
    } else {
      setNoticeMsg('삭제 중 오류가 발생했습니다.');
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (!replyText.trim()) {
      setFeedbackMsg('답변 내용을 입력해 주세요.');
      return;
    }

    const res = addFeedbackReply(selectedPost.id, replyText);
    if (res.success) {
      setFeedbackMsg('답변이 등록 및 저장되었습니다! 📝');
      
      // Voice synthesis confirmation
      if (profile.soundOn && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("건의사항 답변이 성공적으로 저장되었습니다.");
        utterance.lang = 'ko-KR';
        window.speechSynthesis.speak(utterance);
      }

      setReplyText('');
      await loadData();
      
      // Refresh active view
      const updatedFeedbacks = getFeedbackList();
      const nextPost = updatedFeedbacks.find(p => p.id === selectedPost.id);
      setSelectedPost(nextPost);

      setTimeout(() => {
        setFeedbackMsg('');
      }, 3000);
    }
  };

  // Compute stats
  const totalUsers = users.length;
  const totalFeedbacks = feedbacks.length;
  const unresolvedFeedbacks = feedbacks.filter(f => !f.reply).length;
  const averageXp = Math.round(users.reduce((acc, user) => acc + user.xp, 0) / (totalUsers || 1));

  return (
    <div style={{ maxWidth: '950px', margin: '20px auto', width: '100%', padding: '0 20px' }}>
      
      {/* Page Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Shield size={32} style={{ color: 'var(--color-primary)' }} />
        <div>
          <h2 className="font-display" style={{ fontSize: '1.5rem', color: 'var(--color-primary)', margin: 0 }}>
            🛡️ 수련원 관리자 통제실 (Admin Console)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
            가입한 유저 정보 검토, 오답 지표 확인 및 건의사항(게시판) 비밀글 총괄 열람과 답변 조율을 진행합니다.
          </p>
        </div>
      </div>

      {/* 0. Global Notice Controller */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', borderLeft: '4px solid var(--color-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Megaphone size={20} style={{ color: 'var(--color-accent)' }} />
          <h3 className="font-display" style={{ fontSize: '1.1rem', margin: 0 }}>
            전체 수련생 긴급 공지 제어
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
          작성 시 즉시 모든 수련생의 메인 화면에 팝업창으로 송출됩니다. (삭제 시 즉시 내려감)
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={globalNoticeText}
            onChange={(e) => setGlobalNoticeText(e.target.value)}
            placeholder="공지할 내용을 입력하세요 (예: 현재 잔잔한 오류를 수정중 입니다!)"
            style={{
              flex: '1 1 250px', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none'
            }}
          />
          <button onClick={handleSaveNotice} className="theme-btn theme-btn-primary" style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
            팝업 송출
          </button>
          <button onClick={handleDeleteNotice} className="theme-btn" style={{ padding: '0 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
            삭제
          </button>
        </div>
        {noticeMsg && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>{noticeMsg}</div>}
      </div>

      {/* 1. Stat Box Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }} className="admin-stats-grid">
        
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(4, 120, 87, 0.08)', padding: '10px', borderRadius: '50%', color: 'var(--color-primary)' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>총 가입 수련생</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{totalUsers}명</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(4, 120, 87, 0.08)', padding: '10px', borderRadius: '50%', color: 'var(--color-primary)' }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>접수된 총 건의</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{totalFeedbacks}건</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '50%', color: '#ef4444' }}>
            <Reply size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>답변 대기 건</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: unresolvedFeedbacks > 0 ? '#ef4444' : 'inherit' }}>
              {unresolvedFeedbacks}건
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(4, 120, 87, 0.08)', padding: '10px', borderRadius: '50%', color: 'var(--color-primary)' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>평균 수련 XP</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
              {averageXp} XP
            </div>
          </div>
        </div>

      </div>

      {/* 2. Middle Row: Split view (User List & Logs vs Feedback Detail) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr',
        gap: '24px',
        alignItems: 'start'
      }} className="admin-body-split">
        
        {/* Left Side: Users list & Selected User Study Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 className="font-display" style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
              👥 수련생 계정 세부 현황
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
              수련생을 클릭하면 상세 수련 기록 로그가 하단에 나타납니다.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-primary)' }}>
                    <th style={{ padding: '8px' }}>닉네임</th>
                    <th style={{ padding: '8px' }}>이메일</th>
                    <th style={{ padding: '8px' }}>급수</th>
                    <th style={{ padding: '8px' }}>누적 XP</th>
                    <th style={{ padding: '8px' }}>역할</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr 
                      key={i} 
                      style={{ 
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{u.username}</td>
                      <td style={{ padding: '8px', color: 'var(--color-text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '8px' }}>{u.currentLevel}</td>
                      <td style={{ padding: '8px', color: 'var(--color-secondary)', fontWeight: 'bold' }}>{u.xp}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(4, 120, 87, 0.1)',
                          color: u.role === 'admin' ? '#ef4444' : 'var(--color-primary)',
                          fontWeight: 'bold'
                        }}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Feedbacks Detail Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* List of submissions inside admin console */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 className="font-display" style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '12px' }}>
              📥 총괄 건의 건 심사 및 비공개 열람
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {feedbacks.map((f) => (
                <div 
                  key={f.id}
                  onClick={() => { setSelectedPost(f); setReplyText(f.reply || ''); }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    background: selectedPost?.id === f.id ? 'rgba(4, 120, 87, 0.05)' : 'rgba(255,255,255,0.4)',
                    borderColor: selectedPost?.id === f.id ? 'var(--color-primary)' : 'var(--color-border)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: selectedPost?.id === f.id ? 'var(--color-primary)' : 'inherit' }}>
                      {f.title || `💬 ${f.content ? f.content.substring(0, 15) + (f.content.length > 15 ? '...' : '') : '내용 없는 건의'}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      작성자: {f.author || f.contact || '익명 수련생'} | {f.category || (f.type === 'bug' ? '기술 오류' : f.type === 'ux' ? '사용 불편' : '개선 건의')}
                    </div>
                  </div>
                  
                  {f.reply ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>답변완료</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>대기</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Feedback details and reply form */}
          {selectedPost && (
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>
                  {selectedPost.title || (selectedPost.type === 'bug' ? '🐛 기술 오류 제보' : selectedPost.type === 'ux' ? '🙁 사용 불편 신고' : '💡 개선 건의사항')}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  작성자: {selectedPost.author || selectedPost.contact || '익명 수련생'} | 본문 비공개 해제 상태 (Admin)
                </div>
              </div>

              {/* Secret Body Content */}
              <div style={{
                background: 'rgba(4, 120, 87, 0.02)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                marginBottom: '16px'
              }}>
                {selectedPost.body || selectedPost.content}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostReply} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {feedbackMsg && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: 'var(--color-accent)',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {feedbackMsg}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>훈장 답변 작성란</label>
                  <textarea
                    rows="4"
                    placeholder="건의글을 검토하고 처리 결과 또는 가이드를 친절히 답신해 주세요."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="theme-btn theme-btn-primary"
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>답변 등록/업데이트 완료</span>
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
