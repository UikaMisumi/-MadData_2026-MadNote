import React, { useState, useEffect, useRef } from 'react';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import './PostModal.css';

const PostModal = ({ post, isOpen, onClose }) => {
  const { updateLikeCount, updateSaveCount, getComments, addComment, addReply, deleteComment } = usePosts();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLiked, setIsLiked] = useState(post?.is_liked ?? false);
  const [isSaved, setIsSaved] = useState(post?.is_saved ?? false);
  const [likesCount, setLikesCount] = useState(post?.likes_count ?? post?.likesCount ?? 0);
  const [savesCount, setSavesCount] = useState(post?.saves_count ?? post?.savesCount ?? 0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const modalRef = useRef(null);

  // Load comments from API when modal opens
  useEffect(() => {
    if (isOpen && post) {
      setIsLiked(post.is_liked ?? false);
      setIsSaved(post.is_saved ?? false);
      setLikesCount(post.likes_count ?? post.likesCount ?? 0);
      setSavesCount(post.saves_count ?? post.savesCount ?? 0);
      setCurrentSlide(0);
      setReplyTarget(null);
      document.body.style.overflow = 'hidden';

      getComments(post.id).then(setComments);

      const handleKeyDown = (e) => {
        switch (e.key) {
          case 'Escape': onClose(); break;
          case 'ArrowLeft': prevSlide(); break;
          case 'ArrowRight': nextSlide(); break;
          case 'l': case 'L':
            if (!e.ctrlKey && !e.metaKey) handleLike();
            break;
          case 's': case 'S':
            if (!e.ctrlKey && !e.metaKey) handleSave();
            break;
          case 'c': case 'C':
            if (!e.ctrlKey && !e.metaKey) focusCommentBox();
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, post?.id]);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  const handleLike = async () => {
    if (!user) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    const result = await updateLikeCount(post.id);
    if (result) {
      setIsLiked(result.liked);
      setLikesCount(result.likes_count);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setSavesCount(prev => nextSaved ? prev + 1 : Math.max(0, prev - 1));

    const result = await updateSaveCount(post.id);
    if (result) {
      setIsSaved(result.saved);
      setSavesCount(result.saves_count);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const scrollToComments = () => {
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusCommentBox = () => {
    document.getElementById('comment-input')?.focus();
  };

  const nextSlide = () => {
    const count = post.media ? post.media.length : 1;
    setCurrentSlide(prev => (prev + 1) % count);
  };

  const prevSlide = () => {
    const count = post.media ? post.media.length : 1;
    setCurrentSlide(prev => (prev - 1 + count) % count);
  };

  const handleCommentSubmit = async (text) => {
    if (!text.trim()) return;
    try {
      if (replyTarget) {
        const newReply = await addReply(post.id, replyTarget.id, text.trim());
        setComments(prev => prev.map(c =>
          c.id === replyTarget.id
            ? { ...c, replies: [...(c.replies || []), newReply] }
            : c
        ));
        setReplyTarget(null);
      } else {
        const newComment = await addComment(post.id, text.trim());
        setComments(prev => [...prev, newComment]);
      }
    } catch (err) {
      console.error('PostModal: comment submit failed', err);
    }
  };

  const handleReplyClick = (comment) => {
    setReplyTarget(comment);
    setTimeout(() => {
      document.querySelector('.comment-textarea')?.focus();
    }, 100);
  };

  const handleCancelReply = () => setReplyTarget(null);

  const handleReply = async (commentId, replyText) => {
    if (!replyText.trim()) return;
    try {
      const newReply = await addReply(post.id, commentId, replyText.trim());
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, replies: [...(c.replies || []), newReply] }
          : c
      ));
    } catch (err) {
      console.error('PostModal: reply failed', err);
    }
  };

  const handleCommentLike = () => {
    // Comment liking is handled in-place inside CommentItem;
    // no global state sync needed.
  };

  const handleCommentDelete = async (commentId, isReply = false, parentCommentId = null) => {
    try {
      await deleteComment(post.id, commentId);
      if (isReply && parentCommentId) {
        setComments(prev => prev.map(c =>
          c.id === parentCommentId
            ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }
            : c
        ));
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('PostModal: delete comment failed', err);
    }
  };

  if (!isOpen || !post) return null;

  const mediaItems = post.media || [{ type: 'image', url: post.image_url || post.image || post.imageUrl }];
  const hasMultipleMedia = mediaItems.length > 1;

  return (
    <div
      className={`post-modal ${isOpen ? 'open' : ''}`}
      ref={modalRef}
      onClick={handleBackdropClick}
    >
      <div className="panel">
        {/* Media Section */}
        <section className="media">
          <div className="swiper">
            <div className="slide active">
              {mediaItems[currentSlide]?.type === 'video' ? (
                <video src={mediaItems[currentSlide].url} controls autoPlay muted loop />
              ) : (
                <img
                  src={mediaItems[currentSlide]?.url}
                  alt={post.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>

          {hasMultipleMedia && (
            <>
              <button className="nav prev" onClick={prevSlide}>‹</button>
              <button className="nav next" onClick={nextSlide}>›</button>
              <div className="dots">
                {mediaItems.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Action Rail */}
        <aside className="rail">
          <button
            className={`rail-btn ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
            data-act="like"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>{likesCount}</span>
          </button>

          <button className="rail-btn" onClick={scrollToComments} data-act="comment">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span>Comment</span>
          </button>

          <button
            className={`rail-btn ${isSaved ? 'active' : ''}`}
            onClick={handleSave}
            data-act="save"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <span>{savesCount}</span>
          </button>

          <button className="rail-btn" onClick={handleShare} data-act="share">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
            <span>Share</span>
          </button>
        </aside>

        {/* Content Sheet */}
        <article className="sheet">
          <header>
            <img
              className="avatar"
              src={post.author?.avatar || '/default-avatar.png'}
              alt={post.author?.name || 'User'}
            />
            <div className="author">
              <h2 className="title">{post.title}</h2>
              <span className="nick">@{post.author?.username || post.author?.name || 'user'}</span>
            </div>
          </header>

          <section className="body">
            <p>{post.ai_summary || post.abstract || post.content || post.description || 'No description available.'}</p>
          </section>

          <section className="comments" id="comments">
            <h3>Comments ({comments.length})</h3>
            <div className="comment-list">
              {comments.length > 0 ? comments.map((comment, index) => (
                <CommentItem
                  key={comment.id || index}
                  comment={comment}
                  onReply={handleReply}
                  onLike={handleCommentLike}
                  onDelete={handleCommentDelete}
                  currentUser={user}
                  onReplyClick={handleReplyClick}
                  replyTarget={replyTarget}
                />
              )) : (
                <div className="no-comments">
                  <div className="no-comments-icon">💬</div>
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </section>

          <CommentInput
            onSubmit={handleCommentSubmit}
            placeholder={replyTarget ? `回复 @${replyTarget.author?.name || 'Anonymous'}...` : 'Add a comment...'}
            replyTo={replyTarget}
            onCancelReply={handleCancelReply}
          />
        </article>

        <button className="close-btn" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PostModal;
