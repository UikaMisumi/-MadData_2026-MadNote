import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './IntroPage.css';

const BUBBLES = [
  { label: 'Foundation Models', category: 'Foundation_Models', size: 'xl', pos: 1 },
  { label: 'Robotics', category: 'Robotics', size: 'lg', pos: 2 },
  { label: 'AI for Science', category: 'AI_for_Science', size: 'xl', pos: 3 },
  { label: 'HCI', category: 'HCI', size: 'md', pos: 4 },
  { label: 'NLP & IR', category: 'NLP_IR', size: 'lg', pos: 5 },
];

function IntroPage() {
  const navigate = useNavigate();
  const [bubblesShown, setBubblesShown] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [activeBubble, setActiveBubble] = useState(null);

  const handleScreenClick = () => {
    if (!bubblesShown) {
      setBubblesShown(true);
    }
  };

  const handleBubbleClick = (bubble, e) => {
    if (e) e.stopPropagation();
    if (transitioning || !bubblesShown) return;
    setTransitioning(true);
    setActiveBubble(bubble);
    setTimeout(() => {
      navigate('/feed', { state: { category: bubble.category }, replace: true });
    }, 800);
  };

  return (
    <div
      className={`intro-screen ${bubblesShown ? 'bubbles-visible' : ''} ${transitioning ? 'transitioning' : ''}`}
      onClick={handleScreenClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleScreenClick()}
      aria-label="Tap to explore"
    >
      <div className="intro-blob intro-blob-1" />
      <div className="intro-blob intro-blob-2" />

      <div className={`intro-text-container ${bubblesShown ? 'hidden' : ''}`}>
        <div className="intro-logo">M</div>
        <h1 className="intro-title">MadNote</h1>
        <p className="intro-subtitle">Tap anywhere to explore</p>
      </div>

      <div className={`bubbles-container ${bubblesShown ? 'active' : ''} ${transitioning ? 'pointer-events-none' : ''}`}>
        <div className="bubbles-center-point">
          {BUBBLES.map((bubble) => (
            <div
              key={bubble.label}
              className={`bubble-wrapper pos-${bubble.pos} ${bubblesShown ? 'rise-up' : ''} ${activeBubble?.label === bubble.label ? 'expanding' : ''} ${activeBubble && activeBubble.label !== bubble.label ? 'fade-out' : ''}`}
            >
              <div
                className={`bubble-float anim-float-${bubble.pos % 2 + 1}`}
                style={{ animationDelay: `${-(bubble.pos * 0.5)}s` }}
              >
                <button
                  type="button"
                  className={`intro-bubble size-${bubble.size}`}
                  onClick={(e) => handleBubbleClick(bubble, e)}
                >
                  {bubble.label.includes(' ') && bubble.label.length > 10 ? (
                    <>
                      {bubble.label.split(' ').slice(0, -1).join(' ')}
                      <br />
                      {bubble.label.split(' ').slice(-1)[0]}
                    </>
                  ) : (
                    bubble.label
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IntroPage;
