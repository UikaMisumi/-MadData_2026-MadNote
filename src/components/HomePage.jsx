import React, { useState, useEffect } from 'react';
import { usePosts } from '../contexts/PostsContext';
import MasonryGrid from './MasonryGrid';
import FloatingActionButton from './FloatingActionButton';
import './HomePage.css';

function HomePage({ searchTerm }) {
  const { posts } = usePosts();
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!posts) {
      setFilteredPosts([]);
      return;
    }

    let filtered = posts;

    // Apply search filter if searchTerm exists
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = posts.filter(post => 
        post.title?.toLowerCase().includes(term) ||
        post.content?.toLowerCase().includes(term) ||
        post.description?.toLowerCase().includes(term) ||
        post.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        post.author?.name?.toLowerCase().includes(term)
      );
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force re-render by updating state
    setFilteredPosts(prev => [...prev]);
    setIsRefreshing(false);
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <header className="discover-head">
          <h2>Discover</h2>
          <p>AI-powered semantic lineage and cross-disciplinary insights</p>
        </header>

        {searchTerm && (
          <div className="search-info">
            <h2>Search Results</h2>
            <p>
              {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} for "{searchTerm}"
            </p>
          </div>
        )}
        
        {filteredPosts.length > 0 ? (
          <MasonryGrid 
            posts={filteredPosts} 
            showStats={true}
            showPrivBadge={false}
          />
        ) : (
          <div className="home-empty">
            {searchTerm ? (
              <div className="no-results">
                <h3>No results found</h3>
                <p>Try adjusting your search terms or browse all posts</p>
              </div>
            ) : (
              <div className="no-posts">
                <h3>Welcome to MadNote</h3>
                <p>Discover content from the community while we migrate to backend-driven data.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating Action Buttons */}
      <FloatingActionButton type="top" />
      <FloatingActionButton type="refresh" onClick={handleRefresh} />
    </div>
  );
}

export default HomePage;
