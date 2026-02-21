import React, { useState, useEffect } from 'react';
import './FloatingActionButton.css';

const FloatingActionButton = ({ type, onClick, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (type === 'top') {
      const handleScroll = () => {
        const scrollY = window.scrollY;
        setIsVisible(scrollY > 400);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      // Refresh button is always visible
      setIsVisible(true);
    }
  }, [type]);

  const handleClick = () => {
    if (type === 'top') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else if (type === 'refresh' && onClick) {
      onClick();
      // Also scroll to top after refresh
      setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 100);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'top':
        return '↑';
      case 'refresh':
        return '⟳';
      default:
        return '?';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'top':
        return 'Back to top';
      case 'refresh':
        return 'Refresh feed';
      default:
        return '';
    }
  };

  return (
    <button
      className={`fab ${type} ${isVisible ? '' : 'hide'} ${className}`}
      onClick={handleClick}
      title={getTitle()}
      aria-label={getTitle()}
    >
      {getIcon()}
    </button>
  );
};

export default FloatingActionButton;