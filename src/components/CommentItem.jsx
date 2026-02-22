import React, { useState } from 'react';
import './CommentItem.css';

const formatTimestamp = (raw) => {
  if (!raw) return 'Just now';
  const date = typeof raw === 'string' ? new Date(raw) : raw;
  if (Number.isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return `${Math.floor(diffMinutes / 1440)}d ago`;
};

const CommentItem = ({
  comment,
  onReply,
  onLike,
  onDelete,
  currentUser,
  isReply = false,
  onReplyClick = null,
  replyTarget = null,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const replies = comment.replies || [];
  const hasReplies = replies.length > 0;
  const canDelete = !!currentUser && String(comment.author?.id) === String(currentUser.id);

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
            <strong className="comment-author">{comment.author?.name || 'Anonymous'}</strong>
            <span className="comment-time">
              {formatTimestamp(comment.created_at || comment.createdAt || comment.timestamp)}
            </span>

            {canDelete && (
              <button className="delete-comment" onClick={() => onDelete(comment.id)} title="Delete comment" type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>

          <p className="comment-text">{comment.text}</p>

          <div className="comment-actions">
            <button
              className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
              onClick={() => {
                const next = !isLiked;
                setIsLiked(next);
                onLike(comment.id, next);
              }}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{comment.likesCount || comment.likes_count || 0}</span>
            </button>

            {!isReply && (
              <button
                className={`action-btn reply-btn ${replyTarget?.id === comment.id ? 'active' : ''}`}
                onClick={() => onReplyClick && onReplyClick(comment)}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10,9V5L3,12L10,19V14.9C15,14.9 18.5,16.5 21,20C20,15 17,10 10,9Z" />
                </svg>
                <span>Reply</span>
              </button>
            )}

            {hasReplies && !isReply && (
              <button className="action-btn toggle-replies" onClick={() => setShowReplies((prev) => !prev)} type="button">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ transform: showReplies ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
                </svg>
                <span>{replies.length} replies</span>
              </button>
            )}
          </div>
        </div>
      </div>

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
              isReply
              onReplyClick={onReplyClick}
              replyTarget={replyTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
