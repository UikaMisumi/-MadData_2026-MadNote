import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './EmojiPicker.css';

const EMOJI_CATEGORIES = {
  smileys: {
    name: 'Smileys',
    icon: '\u{1F642}',
    emojis: [
      '\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F606}', '\u{1F609}', '\u{1F60A}',
      '\u{1F60D}', '\u{1F618}', '\u{1F60E}', '\u{1F914}', '\u{1F929}', '\u{1F970}',
      '\u{1F973}', '\u{1F62D}', '\u{1F621}', '\u{1F62E}'
    ],
  },
  gestures: {
    name: 'Gestures',
    icon: '\u{1F44D}',
    emojis: [
      '\u{1F44D}', '\u{1F44E}', '\u{1F44F}', '\u{1F64C}', '\u{1F64F}', '\u{1F91D}',
      '\u{1F44C}', '\u{270C}\u{FE0F}', '\u{1F440}', '\u{1F525}', '\u{1F4AF}', '\u{2705}',
      '\u{274C}', '\u{2B50}', '\u{1F4CC}', '\u{1F4A1}'
    ],
  },
  objects: {
    name: 'Objects',
    icon: '\u{1F4AC}',
    emojis: [
      '\u{1F4AC}', '\u{1F4DD}', '\u{1F4DA}', '\u{1F52C}', '\u{1F9E0}', '\u{2699}\u{FE0F}',
      '\u{1F4CA}', '\u{1F4C8}', '\u{1F4BB}', '\u{1F4CE}', '\u{1F517}', '\u{1F9EA}',
      '\u{1F3AF}', '\u{1F680}', '\u{1F310}', '\u{1F4E2}'
    ],
  },
};

const EmojiPicker = ({ isOpen, onClose, onEmojiSelect, anchorRef }) => {
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef(null);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef?.current || !pickerRef.current) return;

    const buttonRect = anchorRef.current.getBoundingClientRect();
    const pickerWidth = pickerRef.current.offsetWidth || 320;
    const pickerHeight = pickerRef.current.offsetHeight || 260;
    const padding = 12;
    const gap = 8;

    let left = buttonRect.right - pickerWidth;
    left = Math.max(padding, Math.min(left, window.innerWidth - pickerWidth - padding));

    let top = buttonRect.top - pickerHeight - gap;
    if (top < padding) {
      top = buttonRect.bottom + gap;
    }
    top = Math.max(padding, Math.min(top, window.innerHeight - pickerHeight - padding));

    setPosition({ top, left });
  }, [isOpen, anchorRef, selectedCategory]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (anchorRef?.current && anchorRef.current.contains(event.target)) {
        return;
      }
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div className="emoji-picker-overlay" style={position}>
      <div className="emoji-picker" ref={pickerRef}>
        <div className="emoji-picker-header">
          <div className="emoji-categories">
            {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                className={`emoji-category ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
                title={category.name}
                type="button"
              >
                {category.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="emoji-grid">
          {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji) => (
            <button
              key={`${selectedCategory}-${emoji}`}
              className="emoji-button"
              onClick={() => {
                onEmojiSelect(emoji);
                onClose();
              }}
              title={emoji}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
