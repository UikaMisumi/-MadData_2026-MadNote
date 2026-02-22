import React from 'react';
import './SelectionActionBar.css';

const SelectionActionBar = ({ count, onGenerate }) => {
  return (
    <div className={`selection-bar ${count > 0 ? 'show' : ''}`}>
      <div className="selection-pill">
        <div className="count-badge">{count}</div>
        <span>Papers Selected</span>
      </div>
      <button type="button" onClick={onGenerate}>
        Generate Macro Insight
      </button>
    </div>
  );
};

export default SelectionActionBar;
