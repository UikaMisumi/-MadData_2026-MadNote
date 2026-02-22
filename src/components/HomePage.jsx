import React, { useEffect, useState } from 'react';
import { usePosts } from '../contexts/PostsContext';
import MasonryGrid from './MasonryGrid';
import FloatingActionButton from './FloatingActionButton';
import SelectionActionBar from './SelectionActionBar';
import InsightModal from './InsightModal';
import GraphModal from './GraphModal';
import './HomePage.css';

function HomePage() {
  const { posts, hasMore, isLoading, loadMore, refreshPosts, query } = usePosts();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [graphTitle, setGraphTitle] = useState('');

  useEffect(() => {
    const visibleIds = new Set((posts || []).map((post) => post.id));
    setSelectedIds((prev) => {
      const next = new Set();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [posts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPosts();
    setIsRefreshing(false);
  };

  const handleToggleSelect = (postId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  };

  const handleOpenGraph = (title) => {
    setGraphTitle(title || 'Current paper');
    setShowGraphModal(true);
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <header className="discover-head fade-up">
          <h2>Discover</h2>
          <p>AI-powered semantic lineage and cross-disciplinary insights</p>
        </header>

        {query && (
          <div className="search-info fade-up">
            <h2>Search Results</h2>
            <p>
              {(posts || []).length} result{(posts || []).length !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>
        )}

        {(posts || []).length > 0 ? (
          <>
            <MasonryGrid
              posts={posts}
              showStats={true}
              showPrivBadge={false}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onOpenGraph={handleOpenGraph}
            />

            <div className="home-load-more-wrap">
              {hasMore ? (
                <button
                  type="button"
                  className="home-load-more-btn"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load more'}
                </button>
              ) : (
                <p className="home-load-more-end">All papers loaded</p>
              )}
            </div>
          </>
        ) : (
          <div className="home-empty">
            {query ? (
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

      <FloatingActionButton type="top" />
      <FloatingActionButton type="refresh" onClick={handleRefresh} />

      <SelectionActionBar count={selectedIds.size} onGenerate={() => setShowInsightModal(true)} />

      <InsightModal
        isOpen={showInsightModal}
        onClose={() => setShowInsightModal(false)}
        selectedCount={selectedIds.size}
      />

      <GraphModal
        isOpen={showGraphModal}
        onClose={() => setShowGraphModal(false)}
        title={graphTitle}
      />
    </div>
  );
}

export default HomePage;
