import React, { useState, useEffect, useRef } from 'react';
import PostCard from './PostCard';
import PostModal from './PostModal';
import './MasonryGrid.css';

const MasonryGrid = ({ posts, showStats = true, showPrivBadge = false, className = '', showKebab = false, onDelete }) => {
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
        className={`masonry ${className}`} 
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
          />
        ))}
      </div>
      
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  );
};

export default MasonryGrid;