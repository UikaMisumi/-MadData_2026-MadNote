import React, { useEffect, useState } from 'react';
import './FloatingActionButton.css';

const FloatingActionButton = ({ type, onClick, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (type === 'top') {
      const handleScroll = () => setIsVisible(window.scrollY > 400);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
    setIsVisible(true);
    return undefined;
  }, [type]);

  const handleClick = () => {
    if (type === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (type === 'refresh' && onClick) {
      setIsSpinning(true);
      onClick();
      setTimeout(() => window.scrollTo({ top: 0 }), 100);
      setTimeout(() => setIsSpinning(false), 420);
    }
  };

  const icon = type === 'top' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4L5 11h4v9h6v-9h4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={isSpinning ? 'spin' : ''}>
      <path d="M12 4a8 8 0 017.75 6h-2.1A6 6 0 106 14h2.3l-3.3 3.3L1.7 14H4a8 8 0 018-10z" />
    </svg>
  );

  const title = type === 'top' ? 'Back to top' : 'Refresh feed';

  return (
    <button
      className={`fab ${type} ${isVisible ? '' : 'hide'} ${className}`}
      onClick={handleClick}
      title={title}
      aria-label={title}
      type="button"
    >
      <span className={`fab-icon ${type}`}>{icon}</span>
    </button>
  );
};

export default FloatingActionButton;
