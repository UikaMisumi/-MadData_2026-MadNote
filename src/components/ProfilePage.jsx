import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import {
  apiGetLikedPapers,
  apiGetSavedPapers,
  apiUpdateUser,
} from '../api';
import MasonryGrid from './MasonryGrid';
import FloatingActionButton from './FloatingActionButton';
import EditProfileModal from './EditProfileModal';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { updateLikeCount, updateSaveCount } = usePosts();
  const [activeTab, setActiveTab] = useState('likes');
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const loadTabData = useCallback(async () => {
    if (!user) return;

    try {
      if (activeTab === 'likes') {
        const data = await apiGetLikedPapers(user.id);
        setLikedPosts(data.items || []);
      } else {
        const data = await apiGetSavedPapers(user.id);
        setSavedPosts(data.items || []);
      }
    } catch (err) {
      console.error('ProfilePage: loadTabData failed', err);
    }
  }, [user, activeTab]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.avatar]);

  const handleRefresh = async () => {
    await loadTabData();
  };

  const handleProfileSave = async (profileData) => {
    try {
      const updatedUser = await apiUpdateUser(user.id, profileData);
      updateUser(updatedUser);
    } catch (err) {
      console.error('ProfilePage: update profile failed', err);
    }
  };

  const postsToRender = useMemo(() => {
    if (activeTab === 'likes') return likedPosts;
    if (activeTab === 'saves') return savedPosts;
    return [];
  }, [activeTab, likedPosts, savedPosts]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((v) => v[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleProfileLikeToggle = async (paperId) => {
    try {
      const result = await updateLikeCount(paperId);
      if (!result) return null;

      setLikedPosts((prev) => (
        result.liked
          ? prev.map((p) => (
              p.id === paperId
                ? { ...p, is_liked: true, likes_count: result.likes_count }
                : p
            ))
          : prev.filter((p) => p.id !== paperId)
      ));

      setSavedPosts((prev) => (
        prev.map((p) => (
          p.id === paperId
            ? { ...p, is_liked: result.liked, likes_count: result.likes_count }
            : p
        ))
      ));

      return result;
    } catch (err) {
      console.error('ProfilePage: like toggle failed', err);
      return null;
    }
  };

  const handleProfileSaveToggle = async (paperId) => {
    try {
      const result = await updateSaveCount(paperId);
      if (!result) return null;

      setSavedPosts((prev) => (
        result.saved
          ? prev.map((p) => (
              p.id === paperId
                ? { ...p, is_saved: true, saves_count: result.saves_count }
                : p
            ))
          : prev.filter((p) => p.id !== paperId)
      ));

      setLikedPosts((prev) => (
        prev.map((p) => (
          p.id === paperId
            ? { ...p, is_saved: result.saved, saves_count: result.saves_count }
            : p
        ))
      ));

      return result;
    } catch (err) {
      console.error('ProfilePage: save toggle failed', err);
      return null;
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <p>Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="cover" />

        {user.avatar && !avatarLoadFailed ? (
          <img
            className="profile-avatar"
            src={user.avatar}
            alt={user.name || 'User'}
            onError={() => setAvatarLoadFailed(true)}
          />
        ) : (
          <div className="profile-avatar profile-avatar-fallback" aria-label={user.name || 'User avatar'}>
            {getInitials(user.name)}
          </div>
        )}

        <div className="bio">
          <h1 className="uname">{user.name || 'Anonymous User'}</h1>
          <span className="uname-id">@{user.username || user.name || 'user'}</span>
          <p className="motto">{user.bio || 'Chasing red-stone roads | Code & coffee'}</p>

          <button className="edit-profile-btn" onClick={() => setShowEditModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            Edit Profile
          </button>

        </div>
      </header>

      <nav className="profile-tabs">
        <button
          className={activeTab === 'likes' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveTab('likes');
          }}
          data-tab="likes"
          type="button"
        >
          Liked
        </button>
        <button
          className={activeTab === 'saves' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveTab('saves');
          }}
          data-tab="saves"
          type="button"
        >
          Saved
        </button>
      </nav>

      <main className="profile-content">
        <MasonryGrid
          posts={postsToRender}
          showStats={false}
          showPrivBadge={false}
          showKebab={false}
          className={activeTab}
          layout="rows"
          onLikeToggle={handleProfileLikeToggle}
          onSaveToggle={handleProfileSaveToggle}
        />

        {postsToRender.length === 0 && (
          <div className="tab-empty">
            <p>
              {activeTab === 'likes' && 'No liked posts yet. Start liking posts you enjoy!'}
              {activeTab === 'saves' && 'No saved posts yet. Save posts you love!'}
            </p>
          </div>
        )}
      </main>

      <FloatingActionButton type="top" />
      <FloatingActionButton type="refresh" onClick={handleRefresh} />

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        onSave={handleProfileSave}
      />
    </div>
  );
};

export default ProfilePage;
