import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import MasonryGrid from './MasonryGrid';
import FloatingActionButton from './FloatingActionButton';
import EditProfileModal from './EditProfileModal';
import ResetPasswordModal from './ResetPasswordModal';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { posts, getCurrentUserPosts, deletePost } = usePosts();
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Load posts data based on active tab
  const loadPostsData = useCallback(() => {
    if (!user) return;

    // Get user-specific localStorage keys
    const getUserStorageKey = (key) => {
      const userId = user?.id || 'anonymous';
      return `${key}_${userId}`;
    };

    // User's own posts from getCurrentUserPosts (only current user's posts)
    setUserPosts(getCurrentUserPosts());

    // Liked posts from localStorage (user-specific)
    const likedIds = JSON.parse(localStorage.getItem(getUserStorageKey('likedPosts')) || '[]');
    const likedPostsData = posts.filter(post => likedIds.includes(post.id));
    setLikedPosts(likedPostsData);

    // Saved posts from localStorage (user-specific)
    const savedIds = JSON.parse(localStorage.getItem(getUserStorageKey('savedPosts')) || '[]');
    const savedPostsData = posts.filter(post => savedIds.includes(post.id));
    setSavedPosts(savedPostsData);
  }, [user, posts, getCurrentUserPosts]); // 移除 getUserStorageKey 依赖

  useEffect(() => {
    loadPostsData();
  }, [loadPostsData]);

  // Handle scroll for mini avatar effect
  useEffect(() => {
    const handleScroll = () => {
      const avatar = document.querySelector('.profile-avatar');
      const scrollY = window.scrollY;
      
      if (avatar) {
        if (scrollY > 180) {
          avatar.style.transform = 'translate(-50%, -25%) scale(0.5)';
          avatar.style.position = 'fixed';
          avatar.style.left = '24px';
          avatar.style.top = '8px';
          avatar.style.zIndex = '1000';
        } else {
          avatar.style.transform = 'translateX(-50%)';
          avatar.style.position = 'absolute';
          avatar.style.left = '50%';
          avatar.style.top = `calc(var(--banner-h) - var(--avatar)/2)`;
          avatar.style.zIndex = '';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabChange = (tab) => {
    console.log('Tab change requested:', tab, 'Current tab:', activeTab);
    setActiveTab(tab);
  };


  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reload posts data
    loadPostsData();
    setIsRefreshing(false);
  };

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleSettingsAction = (action) => {
    setShowSettingsMenu(false);
    
    switch (action) {
      case 'edit':
        setShowEditModal(true);
        break;
      case 'password':
        setShowPasswordModal(true);
        break;
      case 'logout':
        // TODO: Implement logout
        console.log('Logout clicked');
        break;
      default:
        break;
    }
  };

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettingsMenu && !event.target.closest('.settings-container')) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  const handleProfileSave = (profileData) => {
    // In a real app, you would save to server:
    // await fetch(`/api/users/${user.id}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   },
    //   body: JSON.stringify(profileData)
    // });

    // Update user information in context and localStorage
    updateUser(profileData);
    console.log('Profile updated:', profileData);
  };

  const handleDeletePost = (postId) => {
    deletePost(postId);
    // Reload posts data to reflect the deletion
    loadPostsData();
  };

  // Memoize posts to render to prevent unnecessary re-renders
  const postsToRender = useMemo(() => {
    switch (activeTab) {
      case 'posts':
        return userPosts;
      case 'saves':
        return savedPosts;
      case 'likes':
        return likedPosts;
      default:
        return [];
    }
  }, [activeTab, userPosts, savedPosts, likedPosts]);

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
      {/* Profile Header */}
      <header className="profile-header">
        <div className="cover"></div>
        <img 
          className="profile-avatar"
          src={user.avatar || '/default-avatar.png'} 
          alt={user.name || 'User'}
        />
        
        {/* Settings Gear Button */}
        <div className="settings-container">
          <button 
            id="btn-settings" 
            className="gear" 
            title="Settings"
            onClick={handleSettingsClick}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
          
          {/* Settings Dropdown */}
          <ul 
            id="menu-settings" 
            className={`dropdown ${showSettingsMenu ? '' : 'hide'}`}
          >
            <li data-act="edit" onClick={() => handleSettingsAction('edit')}>
              Edit profile
            </li>
            <li data-act="password" onClick={() => handleSettingsAction('password')}>
              Reset password
            </li>
            <li className="divider"></li>
            <li data-act="logout" className="danger" onClick={() => handleSettingsAction('logout')}>
              Log out
            </li>
          </ul>
        </div>
        
        <div className="bio">
          <h1 className="uname">{user.name || 'Anonymous User'}</h1>
          <span className="uname-id">@{user.username || user.name || 'user'}</span>
          <p className="motto">
            {user.bio || 'Chasing red‑stone roads • Code & coffee'}
          </p>
          
          {/* Edit Profile button */}
          <button 
            className="edit-profile-btn"
            onClick={() => setShowEditModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit Profile
          </button>
          
          {/* Stats counters */}
          <ul className="counters">
            <li><b>{user.followingCount || 101}</b> Following</li>
            <li><b>{user.followersCount || 95}</b> Followers</li>
            <li><b>{likedPosts.length + savedPosts.length}</b> Likes + Saves</li>
          </ul>
        </div>
      </header>

      {/* Profile Tabs */}
      <nav className="profile-tabs">
        <button 
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTabChange('posts');
          }}
          data-tab="posts"
          type="button"
        >
          Posts
        </button>
        <button 
          className={activeTab === 'saves' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTabChange('saves');
          }}
          data-tab="saves"
          type="button"
        >
          Saved
        </button>
        <button 
          className={activeTab === 'likes' ? 'active' : ''}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTabChange('likes');
          }}
          data-tab="likes"
          type="button"
        >
          Liked
        </button>
      </nav>

      {/* Posts Grid */}
      <main className="profile-content">
        <MasonryGrid
          posts={postsToRender}
          showStats={false}
          showPrivBadge={activeTab === 'posts'}
          showKebab={activeTab === 'posts'} // Only show kebab menu on user's posts
          onDelete={handleDeletePost}
          className={activeTab}
        />
        
        {postsToRender.length === 0 && (
          <div className="tab-empty">
            <p>
              {activeTab === 'posts' && 'No posts yet. Share your first moment!'}
              {activeTab === 'saves' && 'No saved posts yet. Save posts you love!'}
              {activeTab === 'likes' && 'No liked posts yet. Start liking posts you enjoy!'}
            </p>
          </div>
        )}
      </main>
      
      {/* Floating Action Buttons */}
      <FloatingActionButton type="top" />
      <FloatingActionButton type="refresh" onClick={handleRefresh} />

      {/* Modals */}
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