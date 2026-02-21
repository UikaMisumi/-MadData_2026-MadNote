import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ActionBar.css';

function ActionBar({ post, onLike, onSave, onComment, onShare }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);

  // Get user-specific localStorage keys
  const getUserStorageKey = (key) => {
    const userId = user?.id || 'anonymous';
    return `${key}_${userId}`;
  };

  useEffect(() => {
    // 检查是否已保存 (用户特定)
    const savedPosts = JSON.parse(localStorage.getItem(getUserStorageKey('savedPosts')) || '[]');
    setIsSaved(savedPosts.includes(post?.id));

    // 检查是否已点赞 (用户特定)
    const likedPosts = JSON.parse(localStorage.getItem(getUserStorageKey('likedPosts')) || '[]');
    setIsLiked(likedPosts.includes(post?.id));
  }, [post?.id, user?.id]); // 添加 user?.id 依赖

  const handleLike = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    setLikeCount(newLikeCount);

    // 更新localStorage
    const likedPosts = JSON.parse(localStorage.getItem(getUserStorageKey('likedPosts')) || '[]');
    if (newIsLiked) {
      likedPosts.push(post.id);
    } else {
      const index = likedPosts.indexOf(post.id);
      if (index > -1) likedPosts.splice(index, 1);
    }
    localStorage.setItem(getUserStorageKey('likedPosts'), JSON.stringify(likedPosts));

    if (onLike) onLike(newIsLiked, newLikeCount);
  };

  const handleSave = () => {
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);

    // 更新localStorage
    const savedPosts = JSON.parse(localStorage.getItem(getUserStorageKey('savedPosts')) || '[]');
    if (newIsSaved) {
      savedPosts.push(post.id);
      // 显示保存提示
      setShowSaveTooltip(true);
      setTimeout(() => setShowSaveTooltip(false), 2000);
    } else {
      const index = savedPosts.indexOf(post.id);
      if (index > -1) savedPosts.splice(index, 1);
    }
    localStorage.setItem(getUserStorageKey('savedPosts'), JSON.stringify(savedPosts));

    if (onSave) onSave(newIsSaved);
  };

  const handleComment = () => {
    if (onComment) onComment();
  };

  const handleShare = () => {
    // 复制链接到剪贴板
    const url = `${window.location.origin}/#/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      // 可以添加分享成功提示
    });
    
    if (onShare) onShare();
  };

  return (
    <div className="action-bar">
      <button 
        className={`action-btn ${isLiked ? 'liked' : ''}`}
        onClick={handleLike}
        aria-label={isLiked ? 'Unlike post' : 'Like post'}
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path 
            fill="currentColor" 
            d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
          />
        </svg>
        <span className="action-text">Like</span>
        {likeCount > 0 && <span className="action-count">({likeCount})</span>}
      </button>

      <button 
        className={`action-btn save-btn ${isSaved ? 'saved' : ''}`}
        onClick={handleSave}
        aria-label={isSaved ? 'Remove from saved' : 'Save post'}
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path 
            fill="currentColor" 
            d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z"
          />
        </svg>
        <span className="action-text">Save</span>
        
        {/* 保存成功提示 */}
        {showSaveTooltip && (
          <div className="save-tooltip" role="tooltip">
            Saved to Your Board
          </div>
        )}
      </button>

      <button 
        className="action-btn"
        onClick={handleComment}
        aria-label="Comment on post"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path 
            fill="currentColor" 
            d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"
          />
        </svg>
        <span className="action-text">Comment</span>
      </button>

      <button 
        className="action-btn"
        onClick={handleShare}
        aria-label="Share post"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path 
            fill="currentColor" 
            d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z"
          />
        </svg>
        <span className="action-text">Share</span>
      </button>
    </div>
  );
}

export default ActionBar;