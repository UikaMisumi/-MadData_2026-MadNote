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
  showKebab = false, // Show kebab menu for profile posts
  onDelete
}) => {
  const { updateLikeCount, updateSaveCount } = usePosts();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get user-specific localStorage keys
  const getUserStorageKey = (key) => {
    const userId = user?.id || 'anonymous';
    return `${key}_${userId}`;
  };

  useEffect(() => {
    // Load like/save state from localStorage
    const updateStates = () => {
      const likedPosts = JSON.parse(localStorage.getItem(getUserStorageKey('likedPosts')) || '[]');
      const savedPosts = JSON.parse(localStorage.getItem(getUserStorageKey('savedPosts')) || '[]');
      
      setIsLiked(likedPosts.includes(post.id));
      setIsSaved(savedPosts.includes(post.id));
    };

    updateStates();

    // Listen for custom events to sync states between components
    const handleLikeChange = (e) => {
      if (e.detail.postId === post.id) {
        setIsLiked(e.detail.isLiked);
      }
    };

    const handleSaveChange = (e) => {
      if (e.detail.postId === post.id) {
        setIsSaved(e.detail.isSaved);
      }
    };

    window.addEventListener('postLikeChange', handleLikeChange);
    window.addEventListener('postSaveChange', handleSaveChange);

    return () => {
      window.removeEventListener('postLikeChange', handleLikeChange);
      window.removeEventListener('postSaveChange', handleSaveChange);
    };
  }, [post.id, user?.id]); // 添加 user?.id 依赖

  const handleLike = (e) => {
    e.stopPropagation();
    const likedPosts = JSON.parse(localStorage.getItem(getUserStorageKey('likedPosts')) || '[]');
    
    if (isLiked) {
      const updated = likedPosts.filter(id => id !== post.id);
      localStorage.setItem(getUserStorageKey('likedPosts'), JSON.stringify(updated));
    } else {
      likedPosts.push(post.id);
      localStorage.setItem(getUserStorageKey('likedPosts'), JSON.stringify(likedPosts));
    }
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    updateLikeCount(post.id, newLikedState);
    
    // Dispatch custom event to sync with other components
    window.dispatchEvent(new CustomEvent('postLikeChange', {
      detail: { postId: post.id, isLiked: newLikedState }
    }));
    
    console.log(`Post ${post.id} ${newLikedState ? 'liked' : 'unliked'}`);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    const savedPosts = JSON.parse(localStorage.getItem(getUserStorageKey('savedPosts')) || '[]');
    
    if (isSaved) {
      const updated = savedPosts.filter(id => id !== post.id);
      localStorage.setItem(getUserStorageKey('savedPosts'), JSON.stringify(updated));
    } else {
      savedPosts.push(post.id);
      localStorage.setItem(getUserStorageKey('savedPosts'), JSON.stringify(savedPosts));
    }
    
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    updateSaveCount(post.id, newSavedState);
    
    // Dispatch custom event to sync with other components
    window.dispatchEvent(new CustomEvent('postSaveChange', {
      detail: { postId: post.id, isSaved: newSavedState }
    }));
    
    console.log(`Post ${post.id} ${newSavedState ? 'saved' : 'unsaved'}`);
  };

  const handleCardClick = (event) => {
    if (onClick) {
      onClick(post, event);
    }
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
      
      // Wait for animation to complete before actually deleting
      setTimeout(() => {
        onDelete && onDelete(post.id);
      }, 300);
    }
  };

  // Close kebab menu when clicking outside
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
      {/* Private/Draft badges */}
      {post.isPrivate && <span className="post-badge">Private</span>}
      {post.isDraft && <span className="post-badge">Draft</span>}
      
      {/* Kebab menu for profile posts */}
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
      
      {/* 4:5 media container (always present) */}
      <figure className={`thumb ${layout}`}>
        {layout === 'text' ? (
          <div className="text-content">
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </div>
        ) : (
          <>
            {(post.image || post.imageUrl) ? (
              <img 
                src={post.image || post.imageUrl} 
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
        
        {/* Author info */}
        <div className="meta">
          <img 
            className="avatar-small" 
            src={post.author?.avatar || '/default-avatar.png'} 
            alt={post.author?.name || 'User'}
          />
          <span className="author-name">{post.author?.name || 'Anonymous'}</span>
        </div>

        {/* Action row - inline icons + counts */}
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
            <span className="action-count">{post.likesCount || 0}</span>
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
            <span className="action-count">{post.savesCount || 0}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PostCard;