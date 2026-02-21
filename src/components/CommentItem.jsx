import React, { useState } from 'react';
import './CommentItem.css';

const CommentItem = ({ 
  comment, 
  onReply, 
  onLike, 
  onDelete, 
  currentUser, 
  isReply = false,
  onReplyClick = null, // 新增回调函数，用于通知父组件设置回复目标
  replyTarget = null // 当前回复目标，用于高亮回复按钮
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleReplyClick = () => {
    if (onReplyClick) {
      onReplyClick(comment); // 通知父组件设置回复目标
    }
  };

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    onLike(comment.id, !isLiked);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const formatTimestamp = (timestamp) => {
    if (typeof timestamp === 'string') return timestamp;
    
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return `${Math.floor(diffInMinutes / 1440)}天前`;
  };

  const replies = comment.replies || [];
  const hasReplies = replies.length > 0;

  return (
    <div className={`comment-item ${isReply ? 'is-reply' : ''}`}>
      <div className="comment-main">
        <img 
          className="comment-avatar" 
          src={comment.author?.avatar || '/default-avatar.png'}
          alt={comment.author?.name || 'User'}
        />
        
        <div className="comment-content">
          <div className="comment-header">
            <strong className="comment-author">
              {comment.author?.name || 'Anonymous'}
            </strong>
            <span className="comment-time">
              {formatTimestamp(comment.timestamp || comment.createdAt)}
            </span>
            
            {/* 删除按钮 - 只有评论作者能看到 */}
            {currentUser && comment.author?.id === currentUser.id && (
              <button 
                className="delete-comment"
                onClick={() => onDelete(comment.id)}
                title="删除评论"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
          
          <p className="comment-text">{comment.text}</p>
          
          <div className="comment-actions">
            <button 
              className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLikeClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>{comment.likesCount || 0}</span>
            </button>
            
            {!isReply && (
              <button 
                className={`action-btn reply-btn ${replyTarget?.id === comment.id ? 'active' : ''}`}
                onClick={handleReplyClick}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10,9V5L3,12L10,19V14.9C15,14.9 18.5,16.5 21,20C20,15 17,10 10,9Z"/>
                </svg>
                <span>回复</span>
              </button>
            )}
            
            {hasReplies && !isReply && (
              <button 
                className="action-btn toggle-replies"
                onClick={toggleReplies}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  style={{ transform: showReplies ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                </svg>
                <span>{replies.length} 条回复</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 回复列表 */}
      {hasReplies && showReplies && (
        <div className="replies-container">
          {replies.map((reply, index) => (
            <CommentItem
              key={reply.id || index}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
              currentUser={currentUser}
              isReply={true}
              onReplyClick={onReplyClick} // 传递回复点击回调
              replyTarget={replyTarget} // 传递回复目标状态
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;