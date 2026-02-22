import React, { useEffect, useMemo, useState } from 'react';
import { usePosts } from '../contexts/PostsContext';
import './IntroOverlay.css';

const FALLBACK_TOPICS = ['Foundation Models', 'Robotics', 'AI for Science', 'HCI', 'NLP & IR'];
const BUBBLE_SIZE_CLASS = ['size-xl', 'size-lg', 'size-xl', 'size-md', 'size-lg'];
const normalizeTopic = (value) => String(value || '').trim().toLowerCase();

function IntroOverlay() {
  const { categories, setCategory, setQuery } = usePosts();
  const [visible, setVisible] = useState(true);
  const [bubblesShown, setBubblesShown] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');

  const topics = useMemo(() => {
    const fromApi = (categories || [])
      .filter(Boolean)
      .filter((item) => String(item).toLowerCase() !== 'all')
      .filter((item) => String(item).toLowerCase() !== 'general')
      .filter((item) => String(item).trim() !== '');

    const merged = [...fromApi];
    for (const fallback of FALLBACK_TOPICS) {
      if (!merged.some((item) => item.toLowerCase() === fallback.toLowerCase())) {
        merged.push(fallback);
      }
      if (merged.length >= 5) break;
    }
    return merged.slice(0, 5);
  }, [categories]);

  useEffect(() => {
    if (!visible) return undefined;
    document.body.classList.add('intro-lock-scroll');
    return () => {
      document.body.classList.remove('intro-lock-scroll');
    };
  }, [visible]);

  const handleOverlayClick = () => {
    if (!bubblesShown) setBubblesShown(true);
  };

  const handleTopicSelect = (topic, event) => {
    event.stopPropagation();
    setSelectedTopic(topic || '');
    const rawCategory = (categories || []).find(
      (item) => normalizeTopic(item) === normalizeTopic(topic)
    );

    if (rawCategory) {
      setQuery('');
      setCategory(String(rawCategory));
    } else {
      setCategory('');
      setQuery(topic || '');
    }
    setIsExiting(true);
    window.setTimeout(() => {
      setVisible(false);
    }, 620);
  };

  if (!visible) return null;

  return (
    <div
      className={`intro-overlay ${bubblesShown ? 'bubbles-shown' : ''} ${isExiting ? 'is-exiting' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="intro-blob intro-blob-a" />
      <div className="intro-blob intro-blob-b" />

      <div className={`intro-text ${bubblesShown ? 'hidden' : ''}`}>
        <div className="intro-logo">M</div>
        <h1>MadNote</h1>
        <p>Tap anywhere to explore</p>
      </div>

      <div className={`intro-bubbles ${bubblesShown ? 'active' : ''}`}>
        {topics.map((topic, index) => (
          <div
            key={topic}
            className={`intro-bubble-shell pos-${index + 1} ${selectedTopic && selectedTopic !== topic ? 'is-fading' : ''} ${selectedTopic === topic ? 'is-selected' : ''}`}
          >
            <button
              className={`intro-bubble ${BUBBLE_SIZE_CLASS[index] || 'size-lg'} float-${(index % 2) + 1}`}
              type="button"
              onClick={(event) => handleTopicSelect(topic, event)}
            >
              {topic}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IntroOverlay;
