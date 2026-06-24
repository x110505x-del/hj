import React, { useState, useEffect } from 'react';
import { Shield, Users, MessageSquare, BarChart3, Reply, Award, CheckCircle2, ChevronRight, Megaphone, Trash2, Check, RefreshCw } from 'lucide-react';
import { 
  getCloudAdminUsersList, 
  fetchGlobalNotice, 
  updateGlobalNotice, 
  fetchGlobalFeedbacks, 
  replyToGlobalFeedback, 
  deleteUserProfileByKey, 
  updateGlobalFeedback 
} from '../services/dbSync';

export default function AdminPanel({ profile }) {
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [globalNoticeText, setGlobalNoticeText] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const userList = await getCloudAdminUsersList();
      setUsers(userList);
      
      const feedbackList = await fetchGlobalFeedbacks();
      setFeedbacks(feedbackList);
      
      if (userList.length > 0) {
        setSelectedUser(userList[0]);
      }
      
      const notice = await fetchGlobalNotice();
      if (notice && notice.isVisible) {
        setGlobalNoticeText(notice.text);
      }
    } catch (e) {
      console.error("Admin load data failure:", e);
    } finally {
      setIsRefreshing(false);
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

    const res = await replyToGlobalFeedback(selectedPost.id, replyText);
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
      const updatedFeedbacks = await fetchGlobalFeedbacks();
      const nextPost = updatedFeedbacks.find(p => p.id === selectedPost.id);
      setSelectedPost(nextPost);

      setTimeout(() => {
        setFeedbackMsg('');
      }, 3000);
    }
  };

  // Delete user handler
  const handleDeleteUser = async (userKey, username) => {
    if (!userKey) {
      alert('사용자 고유 키(Key)가 식별되지 않아 삭제할 수 없습니다.');
      return;
    }
    if (username === 'Choi Hyeon-sook' || username === '최현숙' || username === 'admin') {
      alert('수련원의 총관리자 계정은 보호 상태이므로 삭제할 수 없습니다.');
      return;
    }
    if (!window.confirm(`⚠️ [경고] 정말 수련생 '${username}' 계정을 강제로 완전히 삭제하시겠습니까?\n해당 사용자의 모든 골드, 경험치, 학습 기록 등이 영구 소멸하며 복구할 수 없습니다.`)) {
      return;
    }

    const success = await deleteUserProfileByKey(userKey);
    if (success) {
      alert(`'${username}' 계정이 데이터베이스에서 완전히 삭제되었습니다.`);
      await loadData();
    } else {
      alert('삭제 도중 오류가 발생했습니다. 네트워크 상태를 확인하세요.');
    }
  };

  // Toggle feedback status (Completed / Pending)
  const handleToggleFeedbackStatus = async (feedbackId, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const success = await updateGlobalFeedback(feedbackId, { status: nextStatus });
    if (success) {
      await loadData();
      const updatedFeedbacks = await fetchGlobalFeedbacks();
      const nextPost = updatedFeedbacks.find(p => p.id === feedbackId);
      setSelectedPost(nextPost);
    } else {
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  // Helper date formatter
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      const y = String(date.getFullYear()).slice(-2);
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}.${m}.${d}`;
    } catch (e) {
      return '-';
    }
  };

  // Compute stats
  const totalUsers = users.length;
  const totalFeedbacks = feedbacks.length;
  const unresolvedFeedbacks = feedbacks.filter(f => !f.reply).length;
  const pendingBugs = feedbacks.filter(f => f.status !== 'completed').length;
  const averageXp = Math.round(users.reduce((acc, user) => acc + user.xp, 0) / (totalUsers || 1));

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
      
      {/* Page Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={32} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h2 className="font-display" style={{ fontSize: '1.5rem', color: 'var(--color-primary)', margin: 0 }}>
              🛡️ 수련원 관리자 통제실 (Admin Console)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
              가입한 유저 정보 관리, 탈퇴(삭제), 실시간 챗봇 접수 내역(완료/미완료 관리) 및 공지를 통제합니다.
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadData}
          disabled={isRefreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          새로고침
        </button>
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <textarea
            rows="5"
            value={globalNoticeText}
            onChange={(e) => setGlobalNoticeText(e.target.value)}
            placeholder="공지할 내용을 입력하세요 (예: 현재 잔잔한 오류를 수정중 입니다!)"
            style={{
              flex: '1 1 250px', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', resize: 'vertical', fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={handleSaveNotice} className="theme-btn theme-btn-primary" style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
              팝업 송출
            </button>
            <button onClick={handleDeleteNotice} className="theme-btn" style={{ padding: '10px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
              삭제
            </button>
          </div>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>오류/건의 피드백</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{totalFeedbacks}건</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '50%', color: '#ef4444' }}>
            <Reply size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>미해결 오류 접수</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: pendingBugs > 0 ? '#ef4444' : 'inherit' }}>
              {pendingBugs}건
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
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px',
        alignItems: 'start'
      }} className="admin-body-split">
        
        {/* Left Side: Users list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 className="font-display" style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
              👥 수련생 계정 세부 관리
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
              가입일자, 최근활동 정보를 파악하고 필요시 계정을 데이터베이스에서 강제 영구 삭제할 수 있습니다.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '450px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-primary)' }}>
                    <th style={{ padding: '8px 4px' }}>닉네임</th>
                    <th style={{ padding: '8px 4px' }}>이메일 주소</th>
                    <th style={{ padding: '8px 4px' }}>가입일</th>
                    <th style={{ padding: '8px 4px' }}>최근 접속</th>
                    <th style={{ padding: '8px 4px' }}>XP</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr 
                      key={i} 
                      style={{ 
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'all 0.2s',
                        height: '42px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{u.username}</td>
                      <td style={{ padding: '8px 4px', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                        {u.email === 'undefined' ? '미연동 익명' : u.email}
                      </td>
                      <td style={{ padding: '8px 4px', color: '#6b7280', fontSize: '0.78rem' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ padding: '8px 4px', color: '#6b7280', fontSize: '0.78rem' }}>{formatDate(u.lastActiveDate || u.lastUpdated)}</td>
                      <td style={{ padding: '8px 4px', color: 'var(--color-secondary)', fontWeight: 'bold' }}>{u.xp}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        {u.role === 'admin' ? (
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 'bold' }}>보호됨</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(u.key, u.username)}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.2s'
                            }}
                            title="계정 강제 삭제"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
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
              📥 오류 제보 및 건의사항 내역
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {feedbacks.length === 0 ? (
                <div style={{ padding: '20px', textShadow: 'none', color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center' }}>
                  접수된 피드백이 존재하지 않습니다.
                </div>
              ) : (
                feedbacks.map((f) => {
                  const isCompleted = f.status === 'completed';
                  return (
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
                      <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: selectedPost?.id === f.id ? 'var(--color-primary)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            backgroundColor: isCompleted ? '#d1fae5' : '#fee2e2', 
                            color: isCompleted ? '#065f46' : '#991b1b', 
                            padding: '1.5px 5px', 
                            borderRadius: '4px', 
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            {isCompleted ? '완료' : '미완료'}
                          </span>
                          <span>{f.title || `💬 챗봇 제보`}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                          일자: {f.createdAt} | 유형: {f.category}
                        </div>
                      </div>
                      
                      {f.reply ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 'bold', flexShrink: 0 }}>답변완료</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 'bold', flexShrink: 0 }}>답변대기</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Feedback details and reply form */}
          {selectedPost && (
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {selectedPost.title || '챗봇 피드백 상세'}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  작성자: {selectedPost.author || '익명 수련생'} | 접수일: {selectedPost.createdAt}
                </div>
              </div>

              {/* Developer Checkbox style completed toggler */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: selectedPost.status === 'completed' ? '#ecfdf5' : '#fef2f2',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedPost.status === 'completed' ? '#a7f3d0' : '#fecaca',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: selectedPost.status === 'completed' ? '#065f46' : '#991b1b' }}>
                  개발 오류 처리 상태
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleFeedbackStatus(selectedPost.id, selectedPost.status)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.78rem',
                    backgroundColor: selectedPost.status === 'completed' ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s'
                  }}
                >
                  {selectedPost.status === 'completed' ? (
                    <>
                      <Check size={13} />
                      해결 완료 (클릭 시 취소)
                    </>
                  ) : (
                    <>
                      ⚠️ 미해결 (클릭 시 완료 처리)
                    </>
                  )}
                </button>
              </div>

              {/* Secret Body Content */}
              <div style={{
                background: '#f9fafb',
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
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#374151' }}>수련생 답신 멘트</label>
                  <textarea
                    rows="3"
                    placeholder="건의글을 검토하고 처리 결과 또는 해결 답변을 기재하세요."
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
                    gap: '4px',
                    marginTop: '4px'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>답변 저장 및 전송</span>
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
