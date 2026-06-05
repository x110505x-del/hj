import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Lock, Unlock, ArrowLeft, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { getFeedbackList, createFeedback } from '../services/mockDb';

export default function FeedbackBoard({ profile, onNavigate }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'write' | 'view'
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Write Form states
  const [category, setCategory] = useState('기술적 오류');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [writeFeedback, setWriteFeedback] = useState('');

  // Reload feedbacks list
  const loadFeedbacks = () => {
    setFeedbacks(getFeedbackList());
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setWriteFeedback('제목과 내용을 모두 작성해 주세요.');
      return;
    }

    createFeedback(category, title, body, profile.username);
    setWriteFeedback('건의사항이 등록되었습니다! 작성자와 관리자만 세부 본문을 열람할 수 있습니다.');
    setTitle('');
    setBody('');
    loadFeedbacks();

    setTimeout(() => {
      setWriteFeedback('');
      setViewMode('list');
    }, 2000);
  };

  const checkHasAccess = (post) => {
    if (profile.role === 'admin') return true;
    if (profile.username === post.author) return true;
    return false;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', width: '100%', padding: '0 20px' }}>
      
      {/* Header title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="font-display" style={{
          fontSize: '1.5rem',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: 0
        }}>
          <MessageSquare size={24} />
          수련생 건의 & 불편사항 게시판
        </h2>
        
        {viewMode === 'list' && (
          <button 
            className="theme-btn theme-btn-primary"
            onClick={() => setViewMode('write')}
            style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> 건의 등록하기
          </button>
        )}

        {viewMode !== 'list' && (
          <button 
            className="theme-btn theme-btn-secondary"
            onClick={() => { setViewMode('list'); setSelectedPost(null); setWriteFeedback(''); }}
            style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> 목록으로
          </button>
        )}
      </div>

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="glass-card" style={{ padding: '16px', overflowX: 'auto' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
            💡 수련원 이용 중 겪으신 불편사항이나 오류, 또는 기능 제안을 남겨주시면 관리자가 확인 후 답변드립니다.<br />
            <strong>보안 준수를 위해 제목만 전체 공개되며 본문 내용은 작성자 본인과 관리자만 조회 가능합니다.</strong>
          </p>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-primary)' }}>
                <th style={{ padding: '12px 8px', width: '120px' }}>분류</th>
                <th style={{ padding: '12px 8px' }}>제목</th>
                <th style={{ padding: '12px 8px', width: '100px' }}>작성자</th>
                <th style={{ padding: '12px 8px', width: '100px' }}>등록일</th>
                <th style={{ padding: '12px 8px', width: '90px' }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    등록된 건의사항이 없습니다. 첫 의견을 작성해 주세요!
                  </td>
                </tr>
              ) : (
                feedbacks.map((post) => {
                  const hasAccess = checkHasAccess(post);
                  return (
                    <tr 
                      key={post.id} 
                      onClick={() => { setSelectedPost(post); setViewMode('view'); }}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(4, 120, 87, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          background: post.category === '기술적 오류' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(4, 120, 87, 0.1)',
                          color: post.category === '기술적 오류' ? '#ef4444' : 'var(--color-primary)',
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 'bold'
                        }}>
                          {post.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {hasAccess ? <Unlock size={14} style={{ color: 'var(--color-accent)' }} /> : <Lock size={14} style={{ color: 'var(--color-text-muted)' }} />}
                        <span style={{ fontWeight: '500' }}>{post.title}</span>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--color-text-muted)' }}>
                        {post.author.length > 2 ? post.author.substring(0, 1) + '＊' + post.author.substring(post.author.length - 1) : post.author}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--color-text-muted)' }}>{post.createdAt}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {post.reply ? (
                          <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '0.8rem' }}>답변완료</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>접수중</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- WRITE VIEW --- */}
      {viewMode === 'write' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="font-display" style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--color-primary)' }}>
            📝 신규 건의 및 오류 사항 제안
          </h3>

          {writeFeedback && (
            <div style={{
              background: 'rgba(4, 120, 87, 0.08)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
              color: 'var(--color-primary)',
              marginBottom: '16px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {writeFeedback}
            </div>
          )}

          <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>문의 카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="기술적 오류">기술적 오류 (버그 접수)</option>
                  <option value="기능 건의">기능 건의 (시스템 제안)</option>
                  <option value="콘텐츠 건의">콘텐츠 건의 (한자 오류)</option>
                  <option value="기타">기타 문의사항</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>문의 제목</label>
                <input
                  type="text"
                  placeholder="제목을 간략하게 작성하세요 (전체 공개 노출)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--color-border)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>상세 문의 본문 내용</label>
              <textarea
                rows="8"
                placeholder="관리자에게 전달할 구체적인 내용 또는 오류 현상을 상세히 작성하세요. 이 항목은 작성자와 관리자만 볼 수 있게 비공개 처리됩니다."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <button 
              type="submit"
              className="theme-btn theme-btn-primary"
              style={{ padding: '12px', fontSize: '1rem', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Send size={18} /> 건의사항 접수하기
            </button>
          </form>
        </div>
      )}

      {/* --- POST VIEW (WITH ACCESS LOCKS) --- */}
      {viewMode === 'view' && selectedPost && (
        <div className="glass-card" style={{ padding: '24px' }}>
          
          {/* Top metadata */}
          <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: 'rgba(4, 120, 87, 0.08)',
                color: 'var(--color-primary)',
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '12px',
                fontWeight: 'bold'
              }}>
                {selectedPost.category}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>등록일: {selectedPost.createdAt}</span>
            </div>
            
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 'bold' }}>{selectedPost.title}</h3>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              작성자: {selectedPost.author} {profile.username === selectedPost.author ? '(나)' : ''}
            </div>
          </div>

          {/* Access Control Check */}
          {checkHasAccess(selectedPost) ? (
            <div>
              {/* Detailed inquiry body */}
              <div style={{
                background: 'rgba(4, 120, 87, 0.02)',
                padding: '16px',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--color-border)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                minHeight: '120px',
                marginBottom: '24px'
              }}>
                {selectedPost.body}
              </div>

              {/* Admin response layer */}
              {selectedPost.reply ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '18px',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--color-primary)',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    marginBottom: '8px'
                  }}>
                    <CheckCircle2 size={18} />
                    <span>훈장(관리자)의 피드백 답변</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {selectedPost.reply}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255, 191, 0, 0.05)',
                  border: '1px dashed rgba(217, 119, 6, 0.2)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '14px',
                  color: 'var(--color-gold)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <HelpCircle size={16} />
                  <span>관리자가 아직 접수한 건의내역을 검토 중입니다. 곧 답변을 기재하겠습니다.</span>
                </div>
              )}
            </div>
          ) : (
            /* Locked Error Screen */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.02)',
              border: '1px dashed rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--border-radius-lg)',
              marginTop: '10px'
            }}>
              <Lock size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#b91c1c', margin: 0 }}>
                비밀글입니다.
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px', maxWidth: '360px', margin: '8px auto 0 auto' }}>
                개인정보 보호 및 양방향 소통 채널 보안을 위해 글쓴이 본인과 관리자만 열람할 수 있습니다.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
