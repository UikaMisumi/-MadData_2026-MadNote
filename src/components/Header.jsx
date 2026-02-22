import React, { useEffect, useRef, useState } from 'react';
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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountRef = useRef(null);

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

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAccountMenuOpen]);

  return (
    <nav className="mn-nav">
      <div className="mn-brand" onClick={() => navigate('/feed')}>
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
          <div className="mn-account" ref={accountRef}>
            <button
              className="mn-account-trigger"
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="menu"
            >
              <span className="mn-avatar">{getInitials(user.name)}</span>
              <span className="mn-user-meta">
                <strong>{user.name || 'User'}</strong>
                <small>{user.email}</small>
              </span>
              <span className={`mn-account-caret ${isAccountMenuOpen ? 'open' : ''}`} aria-hidden="true">
                <svg viewBox="0 0 20 20" width="14" height="14">
                  <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.11l3.71-3.88a.75.75 0 1 1 1.08 1.04l-4.25 4.44a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" />
                </svg>
              </span>
            </button>

            <div className={`mn-account-menu ${isAccountMenuOpen ? 'open' : ''}`} role="menu">
              <Link to="/profile" onClick={() => setIsAccountMenuOpen(false)}>Profile</Link>
              <Link to="/settings" onClick={() => setIsAccountMenuOpen(false)}>Settings</Link>
              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  logout();
                }}
              >
                Sign Out
              </button>
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
