import React, { useEffect, useState } from 'react';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import './PostCard.css';

const normalizeTopic = (value) => String(value || '').trim().toLowerCase();

const deriveTopicLabel = (post) => {
  const category = String(post.category || '').trim();
  if (category && normalizeTopic(category) !== 'general') return category;
  if (Array.isArray(post.tags) && post.tags.length > 0) {
    return String(post.tags[0]).replace(/_/g, ' ').trim();
  }
  return 'Uncategorized';
};

const PostCard = ({
  post,
  onClick,
  showKebab = false,
  onDelete,
  isSelected = false,
  onToggleSelect,
  onOpenGraph,
  onLikeToggle,
  onSaveToggle,
  cardVariant = 'default',
  discoverProfile = null,
}) => {
  const { updateLikeCount, updateSaveCount } = usePosts();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
  const [isSaved, setIsSaved] = useState(post.is_saved ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count ?? post.likesCount ?? 0);
  const [savesCount, setSavesCount] = useState(post.saves_count ?? post.savesCount ?? 0);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const summary = post.ai_summary || post.abstract || post.description || post.content || '';
  const summaryParts = summary.split('. ').filter(Boolean);
  const firstSentence = summaryParts[0] || '';
  const secondSentence = summaryParts[1] || summaryParts[0] || '';
  const topicLabel = deriveTopicLabel(post);
  const related = Array.isArray(post.related_titles)
    ? post.related_titles.slice(0, 2)
    : (post.tags || []).slice(0, 2).map((tag) => `Related topic: ${String(tag).replace(/_/g, ' ')}`);
  const keyPointText = Array.isArray(post.keywords) && post.keywords.length > 0
    ? post.keywords.filter(Boolean).slice(0, 3).join(' / ')
    : (secondSentence || 'Open this paper for detailed insights.');
  const selectedKeywords = Array.isArray(discoverProfile?.selected_keywords)
    ? discoverProfile.selected_keywords
    : [];
  const matchedKeywords = (Array.isArray(post.keywords) ? post.keywords : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((keyword) => selectedKeywords.some((selected) => normalizeTopic(selected) === normalizeTopic(keyword)))
    .slice(0, 3);

  const categoryClass = (() => {
    const c = topicLabel.toLowerCase();
    if (c.includes('foundation')) return 'violet';
    if (c.includes('vision')) return 'emerald';
    if (c.includes('robot')) return 'amber';
    return 'slate';
  })();

  useEffect(() => {
    setIsLiked(post.is_liked ?? false);
    setIsSaved(post.is_saved ?? false);
    setLikesCount(post.likes_count ?? post.likesCount ?? 0);
    setSavesCount(post.saves_count ?? post.savesCount ?? 0);
  }, [post.id, post.is_liked, post.is_saved, post.likes_count, post.saves_count]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showKebabMenu && !event.target.closest('.kebab-container')) {
        setShowKebabMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showKebabMenu]);

  const handleCardClick = (event) => {
    onClick && onClick(post, event);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    const result = onLikeToggle
      ? await onLikeToggle(post.id)
      : await updateLikeCount(post.id);
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
    setSavesCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
    const result = onSaveToggle
      ? await onSaveToggle(post.id)
      : await updateSaveCount(post.id);
    if (result) {
      setIsSaved(result.saved);
      setSavesCount(result.saves_count);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowKebabMenu(false);
    if (window.confirm('Delete this post? This action cannot be undone.')) {
      setIsDeleting(true);
      setTimeout(() => onDelete && onDelete(post.id), 300);
    }
  };

  return (
    <article className={`xh-post ${cardVariant === 'discover' ? 'discover-card' : ''} ${isDeleting ? 'deleting' : ''}`} onClick={handleCardClick}>
      {onToggleSelect && (
        <input
          type="checkbox"
          className="paper-checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(post.id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${post.title}`}
        />
      )}

      {showKebab && (
        <div className="kebab-container">
          <button className="kebab" onClick={(e) => { e.stopPropagation(); setShowKebabMenu((v) => !v); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
            </svg>
          </button>
          <ul className={`mini-menu ${showKebabMenu ? '' : 'hide'}`}>
            <li onClick={handleDeleteClick}>Delete</li>
          </ul>
        </div>
      )}

      <div className="card-head">
        <span className={`category-chip ${categoryClass}`}>{topicLabel}</span>
        <span className="likes-meta">{likesCount} likes</span>
        {cardVariant === 'discover' && (
          <span className="discover-rank-chip">Top Match</span>
        )}
      </div>

      <h3 className="title">{post.title}</h3>

      <div className={`tldr ${categoryClass}`}>
        <p><strong>TL;DR</strong> {firstSentence || 'No AI summary available yet.'}</p>
      </div>

      <ul className="highlights">
        <li><strong>Author:</strong> {post.author?.name || 'Anonymous'}</li>
        <li><strong>Key point:</strong> {keyPointText}</li>
      </ul>

      {cardVariant === 'discover' && matchedKeywords.length > 0 && (
        <div className="discover-keyword-row">
          {matchedKeywords.map((keyword) => (
            <span key={`${post.id}-${keyword}`} className="discover-keyword-chip">
              {keyword}
            </span>
          ))}
        </div>
      )}

      <div className="related">
        <p>Related</p>
        <div>
          {related.length > 0 ? related.map((item, idx) => (
            <button key={`${post.id}-rel-${idx}`} type="button" onClick={(e) => e.stopPropagation()}>
              {item}
            </button>
          )) : (
            <button type="button" onClick={(e) => e.stopPropagation()}>No related items yet</button>
          )}
        </div>
      </div>

      <button
        className="lineage-btn"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenGraph && onOpenGraph(post.title);
        }}
      >
        Explore Semantic Lineage
      </button>

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
    </article>
  );
};

export default PostCard;
