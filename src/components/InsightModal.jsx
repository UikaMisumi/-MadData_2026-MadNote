import React, { useEffect, useState } from 'react';
import './InsightModal.css';

const InsightModal = ({ isOpen, onClose, selectedCount }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="insight-modal" onClick={onClose}>
      <div className="insight-panel" onClick={(e) => e.stopPropagation()}>
        <button className="insight-close" type="button" onClick={onClose}>Close</button>

        <header>
          <h3>Cross-Disciplinary AI Synthesis</h3>
          <p>Edge Compute Engine Active · {selectedCount} papers selected</p>
        </header>

        {loading ? (
          <div className="insight-loading">Synthesizing core innovations...</div>
        ) : (
          <div className="insight-content">
            <section className="reveal-block">
              <p>Targeted Domains</p>
              <div className="chips">
                <span>Robotics & Vision</span>
                <span>LLM Alignment</span>
              </div>
            </section>

            <section className="reveal-block">
              <p>Shared Technical DNA</p>
              <strong>Bypassing traditional data constraints via unsupervised learning.</strong>
            </section>

            <section className="reveal-block">
              <p>Macro Trend Prediction</p>
              <strong>Constraint-Free Generalization is the dominant trajectory.</strong>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightModal;
