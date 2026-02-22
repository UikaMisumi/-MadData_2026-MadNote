import React, { useEffect, useMemo, useState } from 'react';
import { usePosts } from '../contexts/PostsContext';
import './IntroOverlay.css';

const FALLBACK_TOPICS = ['Foundation Models', 'Robotics', 'AI for Science', 'HCI', 'NLP & IR'];
const BUBBLE_SIZE_CLASS = ['size-xl', 'size-lg', 'size-xl', 'size-md', 'size-lg'];
const KEYWORD_BUBBLE_SIZE = ['size-lg', 'size-md', 'size-md', 'size-sm', 'size-sm', 'size-sm'];
const INTRO_DONE_KEY = 'mn_intro_done';
const TOPIC_FALLBACK_KEYWORDS = {
  'foundation models': ['Large Language Model', 'Reasoning', 'Alignment', 'Multimodal', 'Agent', 'Instruction Tuning'],
  robotics: ['Robot Learning', 'Manipulation', 'Embodied AI', 'Navigation', 'Control Policy', 'Vision Language'],
  'ai for science': ['Molecular Dynamics', 'Protein Design', 'Scientific Discovery', 'Medical AI', 'Materials', 'Bioinformatics'],
  hci: ['User Study', 'UX', 'Human Computer Interaction', 'Crowdsourcing', 'Social Computing', 'Accessibility'],
  'nlp & ir': ['Retrieval', 'Question Answering', 'Information Extraction', 'Summarization', 'Cross Lingual', 'Benchmark'],
};
const normalizeTopic = (value) => String(value || '').trim().toLowerCase();

const hasCompletedIntro = () => {
  try {
    return window.sessionStorage.getItem(INTRO_DONE_KEY) === '1';
  } catch {
    return false;
  }
};

const markIntroCompleted = () => {
  try {
    window.sessionStorage.setItem(INTRO_DONE_KEY, '1');
  } catch {
    // Ignore storage failures in private mode.
  }
};

const resetIntroCompletion = () => {
  try {
    window.sessionStorage.removeItem(INTRO_DONE_KEY);
  } catch {
    // Ignore storage failures in private mode.
  }
};

function IntroOverlay() {
  const {
    categories,
    fetchDiscoverKeywords,
    fetchDiscoverKeywordExpansion,
    startDiscoverForYou,
  } = usePosts();
  const [visible, setVisible] = useState(() => !hasCompletedIntro());
  const [bubblesShown, setBubblesShown] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [stage, setStage] = useState('topic');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [secondaryTopics, setSecondaryTopics] = useState([]);
  const [keywordOptions, setKeywordOptions] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [expansionOptions, setExpansionOptions] = useState([]);
  const [selectedExpansion, setSelectedExpansion] = useState([]);
  const [loadingExpansion, setLoadingExpansion] = useState(false);

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
    if (!visible) {
      document.body.classList.remove('intro-lock-scroll');
      return undefined;
    }
    document.body.classList.add('intro-lock-scroll');
    return () => {
      document.body.classList.remove('intro-lock-scroll');
    };
  }, [visible]);

  useEffect(() => {
    const handleReopen = () => {
      resetIntroCompletion();
      setVisible(true);
      setIsExiting(false);
      setBubblesShown(true);
      setStage('topic');
      setSelectedTopic('');
      setSecondaryTopics([]);
      setKeywordOptions([]);
      setSelectedKeywords([]);
      setExpansionOptions([]);
      setSelectedExpansion([]);
      setLoadingKeywords(false);
      setLoadingExpansion(false);
    };

    window.addEventListener('mn:open-intro-overlay', handleReopen);
    return () => {
      window.removeEventListener('mn:open-intro-overlay', handleReopen);
    };
  }, []);

  const handleOverlayClick = () => {
    if (!bubblesShown) setBubblesShown(true);
  };

  const topicFallbackKeywords = (topic) => {
    const key = normalizeTopic(topic);
    return TOPIC_FALLBACK_KEYWORDS[key] || ['Machine Learning', 'Deep Learning', 'Optimization', 'Benchmark', 'Evaluation', 'Neural Network'];
  };

  const handleTopicSelect = async (topic, event) => {
    event.stopPropagation();
    const pickedTopic = topic || '';
    setSelectedTopic(pickedTopic);
    const normalizedTopic = normalizeTopic(topic);
    const secondary = topics
      .filter((item) => normalizeTopic(item) !== normalizedTopic)
      .slice(0, 2);
    setSecondaryTopics(secondary);

    setLoadingKeywords(true);
    const keywords = await fetchDiscoverKeywords(pickedTopic, secondary, 12);
    const initial = ((keywords && keywords.length > 0) ? keywords : topicFallbackKeywords(pickedTopic)).slice(0, 6);
    setKeywordOptions(initial);
    setSelectedKeywords(initial.slice(0, 3));
    setLoadingKeywords(false);
    setStage('keyword');
  };

  const toggleKeyword = (keyword) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((item) => item !== keyword);
      }
      if (prev.length >= 5) return prev;
      return [...prev, keyword];
    });
  };

  const toggleExpansionKeyword = (keyword) => {
    setSelectedExpansion((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((item) => item !== keyword);
      }
      if (prev.length >= 3) return prev;
      return [...prev, keyword];
    });
  };

  const handleNextStage = async (event) => {
    event.stopPropagation();
    if (selectedKeywords.length === 0 || loadingKeywords) return;
    setLoadingExpansion(true);
    const expanded = await fetchDiscoverKeywordExpansion(
      selectedTopic,
      secondaryTopics,
      selectedKeywords,
      10
    );
    const initial = (expanded || [])
      .filter((item) => !selectedKeywords.includes(item))
      .slice(0, 6);
    const fallback = topicFallbackKeywords(selectedTopic)
      .filter((item) => !selectedKeywords.includes(item))
      .slice(0, 6);
    const finalOptions = (initial.length > 0 ? initial : fallback);
    setExpansionOptions(finalOptions);
    setSelectedExpansion(finalOptions.slice(0, 2));
    setLoadingExpansion(false);
    setStage('expand');
  };

  const handleConfirmDiscover = async (event) => {
    event.stopPropagation();
    const finalKeywords = [...new Set([...selectedKeywords, ...selectedExpansion])].slice(0, 8);
    await startDiscoverForYou(selectedTopic, secondaryTopics, 'practical', finalKeywords);
    markIntroCompleted();
    setIsExiting(true);
    window.setTimeout(() => {
      setVisible(false);
    }, 620);
  };

  const handleBackToTopics = (event) => {
    event.stopPropagation();
    setStage('topic');
    setSelectedTopic('');
    setSecondaryTopics([]);
    setKeywordOptions([]);
    setSelectedKeywords([]);
    setExpansionOptions([]);
    setSelectedExpansion([]);
  };

  const handleBackToKeyword = (event) => {
    event.stopPropagation();
    setStage('keyword');
    setExpansionOptions([]);
    setSelectedExpansion([]);
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

      <div className={`intro-bubbles ${bubblesShown ? 'active' : ''} ${stage !== 'topic' ? 'is-hidden' : ''}`}>
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

      {bubblesShown && stage === 'keyword' && (
        <div className="intro-keyword-stage" onClick={(event) => event.stopPropagation()}>
          <div className="intro-keyword-header">
            <h3>{selectedTopic}</h3>
            <p>Round 2: Pick up to 5 seed keywords</p>
          </div>

          <div className="intro-keyword-grid">
            {loadingKeywords && <p className="intro-keyword-loading">Loading keywords...</p>}
            {!loadingKeywords && keywordOptions.map((keyword, index) => (
              <button
                key={keyword}
                className={`intro-keyword-bubble ${KEYWORD_BUBBLE_SIZE[index] || 'size-sm'} ${selectedKeywords.includes(keyword) ? 'active' : ''}`}
                type="button"
                onClick={() => toggleKeyword(keyword)}
              >
                {keyword}
              </button>
            ))}
          </div>

          <div className="intro-keyword-actions">
            <button
              type="button"
              className="intro-keyword-btn ghost"
              onClick={handleBackToTopics}
            >
              Back
            </button>
            <button
              type="button"
              className="intro-keyword-btn primary"
              onClick={handleNextStage}
              disabled={selectedKeywords.length === 0 || loadingKeywords}
            >
              Next Round
            </button>
          </div>
        </div>
      )}

      {bubblesShown && stage === 'expand' && (
        <div className="intro-keyword-stage" onClick={(event) => event.stopPropagation()}>
          <div className="intro-keyword-header">
            <h3>{selectedTopic}</h3>
            <p>Round 3: Add up to 3 expanded keywords</p>
          </div>

          <div className="intro-keyword-grid">
            {loadingExpansion && <p className="intro-keyword-loading">Expanding keywords...</p>}
            {!loadingExpansion && expansionOptions.map((keyword, index) => (
              <button
                key={keyword}
                className={`intro-keyword-bubble ${KEYWORD_BUBBLE_SIZE[index] || 'size-sm'} ${selectedExpansion.includes(keyword) ? 'active' : ''}`}
                type="button"
                onClick={() => toggleExpansionKeyword(keyword)}
              >
                {keyword}
              </button>
            ))}
          </div>

          <div className="intro-keyword-actions">
            <button
              type="button"
              className="intro-keyword-btn ghost"
              onClick={handleBackToKeyword}
            >
              Back
            </button>
            <button
              type="button"
              className="intro-keyword-btn primary"
              onClick={handleConfirmDiscover}
              disabled={loadingExpansion}
            >
              Start Discover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntroOverlay;
