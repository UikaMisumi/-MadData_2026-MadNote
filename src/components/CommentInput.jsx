import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import './CommentInput.css';

const CommentInput = ({
  onSubmit,
  placeholder = 'Add a comment...',
  replyTo = null,
  onCancelReply = null,
  autoFocus = false,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSubmit(value, replyTo);
    setText('');
    setShowEmojiPicker(false);
  };

  const handleEmojiToggle = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => `${prev}${emoji}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setText(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + emoji.length;
      textarea.selectionStart = nextPos;
      textarea.selectionEnd = nextPos;
    });
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSubmit(event);
    } else if (event.key === 'Escape') {
      setShowEmojiPicker(false);
      if (replyTo && onCancelReply) {
        onCancelReply();
      }
    }
  };

  return (
    <div className={`comment-input-container ${replyTo ? 'reply-mode' : ''}`}>
      {replyTo && (
        <div className="reply-indicator">
          <span className="reply-to">
            Replying to <strong>@{replyTo.author?.name || 'Anonymous'}</strong>
          </span>
          <button className="cancel-reply" onClick={onCancelReply} type="button" title="Cancel reply">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
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
              className={`emoji-button ${showEmojiPicker ? 'active' : ''}`}
              onClick={handleEmojiToggle}
              title="Add emoji"
              aria-label="Add emoji"
              aria-expanded={showEmojiPicker}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C6.486,2 2,6.486 2,12s4.486,10 10,10s10-4.486 10-10S17.514,2 12,2z M8.5,9C9.329,9 10,8.329 10,7.5S9.329,6 8.5,6S7,6.671 7,7.5S7.671,9 8.5,9z M15.5,9C16.329,9 17,8.329 17,7.5S16.329,6 15.5,6S14,6.671 14,7.5S14.671,9 15.5,9z M12,17.5c-2.33,0-4.31-1.46-5.11-3.5h10.22C16.31,16.04 14.33,17.5 12,17.5z" />
              </svg>
            </button>

            <div className="char-counter">
              <span className={text.length > 450 ? 'warning' : ''}>{text.length}/500</span>
            </div>

            <button type="submit" className="submit-button" disabled={!text.trim()} title={replyTo ? 'Send reply' : 'Send comment'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
        anchorRef={emojiButtonRef}
      />
    </div>
  );
};

export default CommentInput;
