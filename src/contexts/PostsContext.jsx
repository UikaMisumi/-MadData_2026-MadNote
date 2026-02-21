import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  apiFeed,
  apiLikePaper,
  apiSavePaper,
  apiGetComments,
  apiAddComment,
  apiAddReply,
  apiDeleteComment,
} from '../api';

const PostsContext = createContext();

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};

export const PostsProvider = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState('');

  // Load first page whenever category or user changes
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [category, user?.id]);

  // Fetch a page of papers from the API
  const fetchPosts = useCallback(async (pageNum, cat) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const data = await apiFeed(pageNum, 10, cat);
      const items = data.items || [];
      setPosts(prev => pageNum === 1 ? items : [...prev, ...items]);
      setHasMore(data.has_more ?? false);
    } catch (err) {
      console.error('PostsContext: fetchPosts failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Trigger fetch when page or category changes
  useEffect(() => {
    fetchPosts(page, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  // ---------- Interactions ----------

  const updateLikeCount = async (postId, _unused) => {
    // Optimistic UI — toggle is_liked and likes_count locally; backend is the source of truth
    try {
      const result = await apiLikePaper(postId);
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, is_liked: result.liked, likes_count: result.likes_count }
            : p
        )
      );
      return result;
    } catch (err) {
      console.error('PostsContext: like failed', err);
    }
  };

  const updateSaveCount = async (postId, _unused) => {
    try {
      const result = await apiSavePaper(postId);
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, is_saved: result.saved, saves_count: result.saves_count }
            : p
        )
      );
      return result;
    } catch (err) {
      console.error('PostsContext: save failed', err);
    }
  };

  // ---------- Comments ----------

  const addComment = async (postId, text) => {
    try {
      const newComment = await apiAddComment(postId, text);
      return newComment;
    } catch (err) {
      console.error('PostsContext: addComment failed', err);
      throw err;
    }
  };

  const addReply = async (paperId, commentId, text) => {
    try {
      const newReply = await apiAddReply(paperId, commentId, text);
      return newReply;
    } catch (err) {
      console.error('PostsContext: addReply failed', err);
      throw err;
    }
  };

  const deleteComment = async (paperId, commentId) => {
    try {
      await apiDeleteComment(paperId, commentId);
    } catch (err) {
      console.error('PostsContext: deleteComment failed', err);
      throw err;
    }
  };

  const getComments = async (paperId) => {
    try {
      return await apiGetComments(paperId);
    } catch (err) {
      console.error('PostsContext: getComments failed', err);
      return [];
    }
  };

  // likeComment is now handled per-comment in CommentItem via the API directly.
  // Kept as a no-op for backward compatibility with components that call it.
  const likeComment = () => {};

  const value = {
    posts,
    isLoading,
    hasMore,
    loadMore,
    category,
    setCategory,
    // interaction helpers used by PostCard / PostModal
    updateLikeCount,
    updateSaveCount,
    // comment helpers used by PostModal
    addComment,
    addReply,
    deleteComment,
    getComments,
    likeComment,
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};
