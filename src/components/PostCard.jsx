import React, { useState, useEffect } from 'react';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import './PostCard.css';

const PostCard = ({
  post,
  showStats = true,
  showPrivBadge = false,
  layout = 'default', // 'square', 'text', 'default'
  onClick,
  showKebab = false,
  onDelete,
}) => {
  const { updateLikeCount, updateSaveCount } = usePosts();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
  const [isSaved, setIsSaved] = useState(post.is_saved ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count ?? post.likesCount ?? 0);
  const [savesCount, setSavesCount] = useState(post.saves_count ?? post.savesCount ?? 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync if parent post prop changes (e.g. after feed refresh)
  useEffect(() => {
    setIsLiked(post.is_liked ?? false);
    setIsSaved(post.is_saved ?? false);
    setLikesCount(post.likes_count ?? post.likesCount ?? 0);
    setSavesCount(post.saves_count ?? post.savesCount ?? 0);
  }, [post.id, post.is_liked, post.is_saved, post.likes_count, post.saves_count]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;

    // Optimistic update
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    const result = await updateLikeCount(post.id);
    if (result) {
      setIsLiked(result.liked);
      setLikesCount(result.likes_count);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
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

  const handleCardClick = (event) => {
    if (onClick) onClick(post, event);
  };

  const handleKebabClick = (e) => {
    e.stopPropagation();
    setShowKebabMenu(!showKebabMenu);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowKebabMenu(false);

    if (window.confirm('Delete this post? This action cannot be undone.')) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete && onDelete(post.id);
      }, 300);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showKebabMenu && !event.target.closest('.kebab-container')) {
        setShowKebabMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showKebabMenu]);

  return (
    <div className={`xh-post ${isDeleting ? 'deleting' : ''}`} onClick={handleCardClick}>
      {post.isPrivate && <span className="post-badge">Private</span>}
      {post.isDraft && <span className="post-badge">Draft</span>}

      {showKebab && (
        <div className="kebab-container">
          <button className="kebab" onClick={handleKebabClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
            </svg>
          </button>

          <ul className={`mini-menu ${showKebabMenu ? '' : 'hide'}`}>
            <li onClick={handleDeleteClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
              </svg>
              Delete
            </li>
          </ul>
        </div>
      )}

      {/* 4:5 media container */}
      <figure className={`thumb ${layout}`}>
        {layout === 'text' ? (
          <div className="text-content">
            <h3>{post.title}</h3>
            <p>{post.abstract || post.content}</p>
          </div>
        ) : (
          <>
            {(post.image_url || post.image || post.imageUrl) ? (
              <img
                src={post.image_url || post.image || post.imageUrl}
                alt={post.title}
                loading="lazy"
                className={imageLoaded ? 'loaded' : ''}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
            ) : (
              <div className="placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,19H5V5H19V19Z"/>
                </svg>
              </div>
            )}
            {post.isVideo && <div className="video-indicator">▶</div>}
          </>
        )}
      </figure>

      {/* Card content */}
      <div className="content">
        <h3 className="title">{post.title}</h3>

        <div className="meta">
          <img
            className="avatar-small"
            src={post.author?.avatar || '/default-avatar.png'}
            alt={post.author?.name || 'User'}
          />
          <span className="author-name">{post.author?.name || 'Anonymous'}</span>
        </div>

        <div className="actions">
          <div className="action-group">
            <svg
              className={`action-icon ${isLiked ? 'active like' : ''}`}
              onClick={handleLike}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Like"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="action-count">{likesCount}</span>
          </div>

          <div className="action-group">
            <svg
              className={`action-icon ${isSaved ? 'active save' : ''}`}
              onClick={handleSave}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Save"
            >
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="action-count">{savesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
