import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './Header.css';

function Header({ onSearch }) {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch && onSearch(searchTerm);
  };

  const handleSearchChange = (e) => {
    const next = e.target.value;
    setSearchTerm(next);
    if (onSearch && next.length > 2) onSearch(next);
    if (onSearch && next.length === 0) onSearch('');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((v) => v[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <nav className="mn-nav">
      <div className="mn-brand" onClick={() => navigate('/')}>
        <div className="mn-logo">M</div>
        <div>
          <h1>MadNote</h1>
          <p>The Academic Pulse</p>
        </div>
      </div>

      <div className="mn-nav-center">
        <button className="mn-chip active" type="button">All Feed</button>
        <button className="mn-chip" type="button">Robotics</button>
        <button className="mn-chip" type="button">Foundation Models</button>
      </div>

      <div className="mn-nav-right">
        <form className="mn-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search papers..."
            aria-label="Search papers"
          />
        </form>

        <button
          className="mn-theme-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? 'Light' : 'Dark'}
        </button>

        {user ? (
          <div className="mn-account">
            <button className="mn-account-trigger" type="button">
              <span className="mn-avatar">{getInitials(user.name)}</span>
              <span className="mn-user-meta">
                <strong>{user.name || 'User'}</strong>
                <small>{user.email}</small>
              </span>
            </button>

            <div className="mn-account-menu">
              <Link to="/profile">Profile</Link>
              <Link to="/settings">Settings</Link>
              <button type="button" onClick={logout}>Sign Out</button>
            </div>
          </div>
        ) : (
          <div className="mn-auth-links">
            <Link className={location.pathname === '/login' ? 'active' : ''} to="/login">Log In</Link>
            <Link className="cta" to="/signup">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Header;
