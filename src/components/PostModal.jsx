import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import './PostModal.css';

const PostModal = ({ post, isOpen, onClose, onOpenGraph }) => {
  const { updateLikeCount, updateSaveCount, getComments, addComment, addReply, deleteComment } = usePosts();
  const { user } = useAuth();

  const modalRef = useRef(null);
  const [activeTab, setActiveTab] = useState('ai');
  const [isLiked, setIsLiked] = useState(post?.is_liked ?? false);
  const [isSaved, setIsSaved] = useState(post?.is_saved ?? false);
  const [likesCount, setLikesCount] = useState(post?.likes_count ?? post?.likesCount ?? 0);
  const [savesCount, setSavesCount] = useState(post?.saves_count ?? post?.savesCount ?? 0);
  const [comments, setComments] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [askValue, setAskValue] = useState('');

  const related = useMemo(() => {
    if (!post) return [];
    if (Array.isArray(post.related_titles)) return post.related_titles.slice(0, 2);
    if (Array.isArray(post.tags)) return post.tags.slice(0, 2).map((tag) => `Related topic: ${tag}`);
    return [];
  }, [post]);

  const authorsText = useMemo(() => {
    if (!post) return 'Anonymous';
    if (Array.isArray(post.authors)) {
      return post.authors.filter(Boolean).join(', ') || post.author?.name || 'Anonymous';
    }
    if (typeof post.authors === 'string') {
      return post.authors || post.author?.name || 'Anonymous';
    }
    return post.author?.name || 'Anonymous';
  }, [post]);

  const pdfUrl = useMemo(() => {
    if (!post) return '';
    const url = post.paper_url || post.pdf_url || '';
    return typeof url === 'string' ? url.trim() : '';
  }, [post]);

  useEffect(() => {
    if (!isOpen || !post) return;

    setActiveTab('ai');
    setReplyTarget(null);
    setShowRecommendations(false);
    setAskValue('');
    setIsLiked(post.is_liked ?? false);
    setIsSaved(post.is_saved ?? false);
    setLikesCount(post.likes_count ?? post.likesCount ?? 0);
    setSavesCount(post.saves_count ?? post.savesCount ?? 0);
    document.body.style.overflow = 'hidden';

    getComments(post.id).then(setComments);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, post?.id]);

  if (!isOpen || !post) return null;

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  const handleLike = async () => {
    if (!user) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    const result = await updateLikeCount(post.id);
    if (result) {
      setIsLiked(result.liked);
      setLikesCount(result.likes_count);
      setShowRecommendations(result.liked);
    } else {
      setShowRecommendations(nextLiked);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setSavesCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
    const result = await updateSaveCount(post.id);
    if (result) {
      setIsSaved(result.saved);
      setSavesCount(result.saves_count);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/#/`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url: shareUrl });
      } catch {
        // Ignore cancellation from native share dialog.
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard.');
    }
  };

  const handleCommentSubmit = async (text) => {
    if (!text.trim()) return;

    try {
      if (replyTarget) {
        const newReply = await addReply(post.id, replyTarget.id, text.trim());
        setComments((prev) => prev.map((c) => (
          c.id === replyTarget.id ? { ...c, replies: [...(c.replies || []), newReply] } : c
        )));
        setReplyTarget(null);
      } else {
        const newComment = await addComment(post.id, text.trim());
        setComments((prev) => [...prev, newComment]);
      }
    } catch (err) {
      console.error('PostModal: comment submit failed', err);
    }
  };

  const handleReply = async (commentId, text) => {
    if (!text.trim()) return;
    try {
      const newReply = await addReply(post.id, commentId, text.trim());
      setComments((prev) => prev.map((c) => (
        c.id === commentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
      )));
    } catch (err) {
      console.error('PostModal: reply failed', err);
    }
  };

  const handleCommentDelete = async (commentId, isReply = false, parentCommentId = null) => {
    try {
      await deleteComment(post.id, commentId);
      if (isReply && parentCommentId) {
        setComments((prev) => prev.map((c) => (
          c.id === parentCommentId
            ? { ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }
            : c
        )));
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('PostModal: delete comment failed', err);
    }
  };

  return (
    <div className={`post-modal ${isOpen ? 'open' : ''}`} ref={modalRef} onClick={handleBackdropClick}>
      <div className="paper-shell">
        <div className="paper-topbar">
          <button className="back-btn" type="button" onClick={onClose}>Back to Feed</button>
          <div className="top-user">
            <span>{user?.name || 'Guest'}</span>
          </div>
        </div>

        <div className="paper-body">
          <div className="paper-main">
            <section className="paper-hero">
              <h1 className="paper-title">{post.title}</h1>
              <p className="paper-meta">
                {authorsText}
                {' · '}
                {post.update_date || 'Unknown date'}
              </p>

              <div className="paper-tabs">
                <button
                  type="button"
                  className={activeTab === 'ai' ? 'active' : ''}
                  onClick={() => setActiveTab('ai')}
                >
                  AI Breakdown
                </button>
                <button
                  type="button"
                  className={activeTab === 'original' ? 'active' : ''}
                  onClick={() => setActiveTab('original')}
                >
                  Original Abstract
                </button>
              </div>

              <div className="paper-content">
                {activeTab === 'ai' ? (
                  <div className="section-grid">
                    <section>
                      <h3>The Problem</h3>
                      <p>{post.ai_summary || post.abstract || 'No AI summary available yet.'}</p>
                    </section>
                    <section>
                      <h3>The Method</h3>
                      <p>{post.abstract || post.description || post.content || 'No method details available.'}</p>
                    </section>
                  </div>
                ) : (
                  <p>{post.abstract || post.content || post.description || 'No original abstract available.'}</p>
                )}
              </div>

              <div className="paper-actions">
                <button type="button" className={`paper-act ${isLiked ? 'active' : ''}`} onClick={handleLike}>
                  Like {likesCount}
                </button>
                <button type="button" className={`paper-act ${isSaved ? 'active' : ''}`} onClick={handleSave}>
                  Save {savesCount}
                </button>
                <button type="button" className="paper-act" onClick={handleShare}>Share</button>
              </div>
            </section>

            <section className={`recommend-block ${showRecommendations ? 'show' : ''}`}>
              <h3>Because you liked this...</h3>
              <p>Semantic matches for your reading path.</p>
              <div className="recommend-list">
                {(related.length > 0 ? related : ['No recommendation generated yet.']).map((item, idx) => (
                  <div key={`${post.id}-rec-${idx}`} className="recommend-item">{item}</div>
                ))}
              </div>
            </section>

            <section className="comments-shell" id="comments">
              <h3>Discussions ({comments.length})</h3>
              <CommentInput
                onSubmit={handleCommentSubmit}
                placeholder={replyTarget ? `Reply to @${replyTarget.author?.name || 'Anonymous'}...` : 'Share your thoughts...'}
                replyTo={replyTarget}
                onCancelReply={() => setReplyTarget(null)}
              />
              <div className="comment-list">
                {comments.length > 0 ? comments.map((comment, idx) => (
                  <CommentItem
                    key={comment.id || idx}
                    comment={comment}
                    onReply={handleReply}
                    onLike={() => {}}
                    onDelete={handleCommentDelete}
                    currentUser={user}
                    onReplyClick={setReplyTarget}
                    replyTarget={replyTarget}
                  />
                )) : (
                  <p className="empty-comments">No comments yet. Be the first to comment.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="paper-side">
            <div className="side-actions">
              <button
                type="button"
                disabled={!pdfUrl}
                onClick={() => {
                  if (!pdfUrl) return;
                  window.open(pdfUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                Read PDF
              </button>
            </div>

            <section className="graph-cta">
              <h4>Knowledge Graph</h4>
              <p>Launch the lineage graph for this paper.</p>
              <button type="button" onClick={() => onOpenGraph && onOpenGraph(post.title)}>Launch Graph</button>
            </section>

            <section className="ask-card">
              <h4>Ask Paper</h4>
              <p>Edge inference is ready.</p>
              <div className="ask-log">Ask anything about this paper.</div>
              <div className="ask-input">
                <input
                  type="text"
                  placeholder="e.g. What datasets were used?"
                  value={askValue}
                  onChange={(e) => setAskValue(e.target.value)}
                />
                <button type="button">Send</button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PostModal;

