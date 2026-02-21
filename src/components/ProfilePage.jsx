import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiGetLikedPapers, apiGetSavedPapers, apiUpdateUser } from '../api';
import MasonryGrid from './MasonryGrid';
import FloatingActionButton from './FloatingActionButton';
import EditProfileModal from './EditProfileModal';
import ResetPasswordModal from './ResetPasswordModal';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('likes');
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettingsMenu && !event.target.closest('.settings-container')) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  const handleRefresh = async () => {
    await loadTabData();
  };

  const handleSettingsAction = (action) => {
    setShowSettingsMenu(false);
    if (action === 'edit') setShowEditModal(true);
    else if (action === 'password') setShowPasswordModal(true);
    else if (action === 'logout') logout();
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

        <div className="settings-container">
          <button
            id="btn-settings"
            className="gear"
            title="Settings"
            onClick={() => setShowSettingsMenu((prev) => !prev)}
            aria-expanded={showSettingsMenu}
            aria-haspopup="menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
          </button>

          <ul id="menu-settings" className={`dropdown ${showSettingsMenu ? '' : 'hide'}`} role="menu">
            <li data-act="edit" onClick={() => handleSettingsAction('edit')}>Edit profile</li>
            <li data-act="password" onClick={() => handleSettingsAction('password')}>Reset password</li>
            <li className="divider" />
            <li data-act="logout" className="danger" onClick={() => handleSettingsAction('logout')}>Log out</li>
          </ul>
        </div>

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

          <ul className="counters">
            <li><b>{user.following_count ?? user.followingCount ?? 0}</b> Following</li>
            <li><b>{user.followers_count ?? user.followersCount ?? 0}</b> Followers</li>
            <li><b>{likedPosts.length + savedPosts.length}</b> Likes + Saves</li>
          </ul>
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

      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default ProfilePage;
