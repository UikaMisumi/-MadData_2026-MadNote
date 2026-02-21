import React, { useState, useRef } from 'react';
import PostCard from './PostCard';
import PostModal from './PostModal';
import './MasonryGrid.css';

const MasonryGrid = ({
  posts,
  showStats = true,
  showPrivBadge = false,
  className = '',
  showKebab = false,
  onDelete,
  selectedIds = new Set(),
  onToggleSelect,
  onOpenGraph,
  layout = 'masonry',
}) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const gridRef = useRef(null);

  const handleCardClick = (post, event) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // CSS columns handles layout automatically - no JS positioning needed

  if (!posts || posts.length === 0) {
    return (
      <div className="masonry-empty">
        <p>No posts to display</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`masonry ${layout} ${className}`} 
        ref={gridRef}
      >
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            showStats={showStats}
            showPrivBadge={showPrivBadge}
            showKebab={showKebab}
            onClick={handleCardClick}
            onDelete={onDelete}
            isSelected={selectedIds.has(post.id)}
            onToggleSelect={onToggleSelect}
            onOpenGraph={onOpenGraph}
          />
        ))}
      </div>
      
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onOpenGraph={onOpenGraph}
      />
    </>
  );
};

export default MasonryGrid;
