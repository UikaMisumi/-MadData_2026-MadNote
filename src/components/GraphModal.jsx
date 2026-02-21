import React from 'react';
import './GraphModal.css';

const GraphModal = ({ isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="graph-modal" onClick={onClose}>
      <div className="graph-panel" onClick={(e) => e.stopPropagation()}>
        <div className="graph-head">
          <div>
            <h3>Technology Evolution Graph</h3>
            <p>Semantic lineage for: {title || 'Current paper'}</p>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <div className="graph-canvas">
          <svg viewBox="0 0 900 420" role="img" aria-label="Knowledge graph">
            <line x1="180" y1="120" x2="440" y2="210" className="edge" />
            <line x1="190" y1="300" x2="440" y2="210" className="edge" />
            <line x1="440" y1="210" x2="730" y2="210" className="edge dashed" />

            <g transform="translate(120 80)">
              <circle r="45" className="node-base" />
              <text x="0" y="6" textAnchor="middle">Foundation</text>
            </g>

            <g transform="translate(120 300)">
              <circle r="40" className="node-base" />
              <text x="0" y="6" textAnchor="middle">Prev SOTA</text>
            </g>

            <g transform="translate(440 210)">
              <circle r="58" className="node-center" />
              <text x="0" y="0" textAnchor="middle" className="center-title">Current</text>
              <text x="0" y="20" textAnchor="middle" className="center-sub">Focus</text>
            </g>

            <g transform="translate(780 210)">
              <circle r="42" className="node-next" />
              <text x="0" y="6" textAnchor="middle">Applications</text>
            </g>
          </svg>
        </div>

        <div className="graph-legend">
          <span><i className="dot base" /> Fundamental Research</span>
          <span><i className="dot center" /> Current Focus</span>
          <span><i className="dot next" /> Derived Applications</span>
        </div>
      </div>
    </div>
  );
};

export default GraphModal;
