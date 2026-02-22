import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePosts } from '../contexts/PostsContext';
import './Header.css';

const TOPIC_FALLBACKS = ['Foundation Models', 'Robotics', 'AI for Science', 'HCI', 'NLP & IR'];
const normalizeTopic = (value) => String(value || '').trim().toLowerCase();

function Header() {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { category, setCategory, categories, query, setQuery } = usePosts();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(query || '');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQuery(searchTerm.trim());
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, setQuery]);

  useEffect(() => {
    setSearchTerm(query || '');
  }, [query]);

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

  const categoryMap = (() => {
    const map = new Map();
    for (const raw of categories || []) {
      const key = normalizeTopic(raw);
      if (!key || key === 'all' || key === 'general' || map.has(key)) continue;
      map.set(key, String(raw));
    }
    return map;
  })();

  const chipTopics = (() => {
    const source = (categories || [])
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter((item) => normalizeTopic(item) !== 'all')
      .filter((item) => normalizeTopic(item) !== 'general')
      .filter((item) => item !== '');
    const merged = [...new Set(source)];
    for (const fallback of TOPIC_FALLBACKS) {
      if (!merged.some((item) => normalizeTopic(item) === normalizeTopic(fallback))) {
        merged.push(fallback);
      }
      if (merged.length >= 6) break;
    }
    return merged.slice(0, 6);
  })();

  const applyTopic = (topic) => {
    const rawCategory = categoryMap.get(normalizeTopic(topic));
    if (rawCategory) {
      setSearchTerm('');
      setQuery('');
      setCategory(rawCategory);
      return;
    }
    setCategory('');
    setQuery(topic);
    setSearchTerm(topic);
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
        <button
          className={`mn-chip ${!category && !query ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setSearchTerm('');
            setCategory('');
            setQuery('');
          }}
        >
          All Feed
        </button>
        {chipTopics.map((item) => (
          <button
            key={item}
            className={`mn-chip ${normalizeTopic(category) === normalizeTopic(item) || normalizeTopic(query) === normalizeTopic(item) ? 'active' : ''}`}
            type="button"
            onClick={() => applyTopic(item)}
          >
            {item}
          </button>
        ))}
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
