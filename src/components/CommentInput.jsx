import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import './CommentInput.css';

const CommentInput = ({ 
  onSubmit, 
  placeholder = "Add a comment...", 
  replyTo = null, 
  onCancelReply = null,
  autoFocus = false 
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState(null);
  const textareaRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim(), replyTo);
      setText('');
    }
  };

  const handleEmojiClick = () => {
    if (emojiButtonRef.current) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerPosition({
        top: rect.top - 410, // 确保emoji picker在按钮上方
        left: Math.max(10, rect.left - 150) // 确保不超出屏幕左边
      });
    }
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setText(newText);
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    // 自动调整textarea高度
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    } else if (e.key === 'Escape' && replyTo && onCancelReply) {
      onCancelReply();
    }
  };

  return (
    <div className={`comment-input-container ${replyTo ? 'reply-mode' : ''}`}>
      {replyTo && (
        <div className="reply-indicator">
          <span className="reply-to">
            回复 <strong>@{replyTo.author?.name || 'Anonymous'}</strong>
          </span>
          <button 
            className="cancel-reply"
            onClick={onCancelReply}
            title="取消回复"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-input-wrapper">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="comment-textarea"
            rows="1"
            maxLength="500"
          />
          
          <div className="comment-actions">
            <button
              ref={emojiButtonRef}
              type="button"
              className="emoji-button"
              onClick={handleEmojiClick}
              title="添加表情"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C6.486,2 2,6.486 2,12s4.486,10 10,10s10-4.486 10-10S17.514,2 12,2z M8.5,9C9.329,9 10,8.329 10,7.5 S9.329,6 8.5,6S7,6.671 7,7.5S7.671,9 8.5,9z M15.5,9C16.329,9 17,8.329 17,7.5S16.329,6 15.5,6S14,6.671 14,7.5 S14.671,9 15.5,9z M12,17.5c-2.33,0-4.31-1.46-5.11-3.5h10.22C16.31,16.04 14.33,17.5 12,17.5z"/>
              </svg>
            </button>
            
            <div className="char-counter">
              <span className={text.length > 450 ? 'warning' : ''}>{text.length}/500</span>
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={!text.trim()}
              title={replyTo ? '发送回复' : '发送评论'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
              </svg>
            </button>
          </div>
        </div>
      </form>

      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
        position={emojiPickerPosition}
      />
    </div>
  );
};

export default CommentInput;