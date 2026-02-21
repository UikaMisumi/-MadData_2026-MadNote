import React, { useState } from 'react';
import { Navbar, Nav, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './Header.css';

function Header({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { theme, toggleTheme, isDark } = useTheme();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // 瀹炴椂鎼滅储
    if (onSearch && e.target.value.length > 2) {
      onSearch(e.target.value);
    } else if (onSearch && e.target.value.length === 0) {
      onSearch(''); // 娓呯┖鎼滅储
    }
  };

  return (
    <Navbar 
      expand="lg" 
      className="custom-navbar px-4" 
      fixed="top"
      aria-label="Main navigation"
    >
      <Navbar.Brand as={Link} to="/" className="navbar-brand-custom">
        MadNote
      </Navbar.Brand>
      
      <Navbar.Toggle 
        aria-controls="main-nav" 
        aria-label="Toggle navigation"
        className="navbar-toggle-custom"
      />
      
      <Navbar.Collapse id="main-nav">
        <Nav className="me-auto nav-links-custom">
          <Nav.Link as={Link} to="/" className="nav-link-custom">
            Discover
          </Nav.Link>
          <Nav.Link as={Link} to="/upload" className="nav-link-custom">
            Upload
          </Nav.Link>
          <Nav.Link as={Link} to="/notifications" className="nav-link-custom">
            Notifications
          </Nav.Link>
        </Nav>
        
        <Form className="d-flex search-form-custom mx-auto" onSubmit={handleSearchSubmit}>
          <InputGroup className="search-input-group">
            <Form.Control
              type="text"
              placeholder="Search posts or users..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input-custom"
              aria-label="Search posts or users"
            />
            <button type="submit" className="search-btn-custom" aria-label="Submit search">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
          </InputGroup>
        </Form>
        
        <Nav className="nav-right-custom">
          <Nav.Link href="#" className="nav-link-custom">
            Creator Studio
          </Nav.Link>
          <Nav.Link href="#" className="nav-link-custom">
            Partnerships
          </Nav.Link>
          
          {/* Theme Toggle Button */}
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              // Sun icon for light mode
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-13.66-6.69-13.66-14.96 0-.67.05-1.35.14-2.02.09-.67-.4-1.16-.8-1.16z"/>
              </svg>
            )}
          </button>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default Header;