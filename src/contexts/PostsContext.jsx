import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  apiFeed,
  apiSearch,
  apiCategories,
  apiDiscoverForYou,
  apiDiscoverKeywords,
  apiDiscoverKeywordExpansion,
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
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [discoverProfile, setDiscoverProfile] = useState(null);
  const discoverKey = JSON.stringify(discoverProfile || {});

  // Load first page whenever category, query, or auth context changes.
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [category, query, user?.id, discoverKey]);

  // Load category options from backend to keep chips data-driven.
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await apiCategories();
        if (!mounted) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];
        setCategories(
          list
            .filter(Boolean)
            .map((item) => String(item).trim())
            .filter((item) => item && item.toLowerCase() !== 'general')
        );
      } catch (err) {
        console.error('PostsContext: load categories failed', err);
        if (mounted) setCategories([]);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch a page of papers from the API
  const fetchPosts = useCallback(async (pageNum, cat, searchQuery, profile) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const trimmedQuery = (searchQuery || '').trim();
      const discoverEnabled = Boolean(profile?.enabled && profile?.primary_topic);
      const data = trimmedQuery
        ? await apiSearch(trimmedQuery, pageNum, 10)
        : discoverEnabled
          ? await apiDiscoverForYou({
            primary_topic: profile.primary_topic,
            secondary_topics: profile.secondary_topics || [],
            selected_keywords: profile.selected_keywords || [],
            style_preference: profile.style_preference || '',
            page: pageNum,
            size: 10,
          })
          : await apiFeed(pageNum, 10, cat);
      const items = data.items || [];
      setPosts(prev => pageNum === 1 ? items : [...prev, ...items]);
      setHasMore(data.has_more ?? false);
    } catch (err) {
      console.error('PostsContext: fetchPosts failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Trigger fetch when page/category/auth user changes.
  // Login/logout resets the list; include user id so we always refetch after reset.
  useEffect(() => {
    fetchPosts(page, category, query, discoverProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, query, user?.id, discoverKey]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const refreshPosts = async () => {
    if (isLoading) return;
    setPosts([]);
    setHasMore(true);
    if (page === 1) {
      await fetchPosts(1, category, query, discoverProfile);
      return;
    }
    setPage(1);
  };

  const clearDiscoverProfile = useCallback(() => {
    setDiscoverProfile(null);
  }, []);

  // Initializes Discover-for-You with backend keyword candidates from dynamic_keywords.
  const fetchDiscoverKeywords = useCallback(async (primaryTopic, secondaryTopics = [], limit = 12) => {
    const primary = String(primaryTopic || '').trim();
    const secondary = (secondaryTopics || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    try {
      const data = await apiDiscoverKeywords(primary, secondary, limit);
      return Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
      console.error('PostsContext: discover keywords failed', err);
      return [];
    }
  }, []);

  const fetchDiscoverKeywordExpansion = useCallback(async (
    primaryTopic,
    secondaryTopics = [],
    seedKeywords = [],
    limit = 10
  ) => {
    const primary = String(primaryTopic || '').trim();
    const secondary = (secondaryTopics || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    const seed = (seedKeywords || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    try {
      const data = await apiDiscoverKeywordExpansion(primary, secondary, seed, limit);
      return Array.isArray(data?.items) ? data.items : [];
    } catch (err) {
      console.error('PostsContext: discover keyword expansion failed', err);
      return [];
    }
  }, []);

  // Initializes Discover-for-You with backend keyword candidates from dynamic_keywords.
  const startDiscoverForYou = useCallback(async (
    primaryTopic,
    secondaryTopics = [],
    stylePreference = 'practical',
    preferredKeywords = []
  ) => {
    const primary = String(primaryTopic || '').trim();
    const secondary = (secondaryTopics || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    const normalizedPreferred = (preferredKeywords || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 12);

    const selectedKeywords = normalizedPreferred.length > 0
      ? normalizedPreferred
      : await fetchDiscoverKeywords(primary, secondary, 12);

    setCategory('');
    setQuery('');
    setDiscoverProfile({
      enabled: true,
      primary_topic: primary,
      secondary_topics: secondary,
      selected_keywords: selectedKeywords,
      style_preference: stylePreference,
    });
  }, [fetchDiscoverKeywords]);

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
    refreshPosts,
    category,
    setCategory,
    query,
    setQuery,
    categories,
    discoverProfile,
    setDiscoverProfile,
    clearDiscoverProfile,
    fetchDiscoverKeywords,
    fetchDiscoverKeywordExpansion,
    startDiscoverForYou,
    isDiscoverMode: Boolean(discoverProfile?.enabled && discoverProfile?.primary_topic && !(query || '').trim()),
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
