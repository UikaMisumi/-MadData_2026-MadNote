import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './GraphModal.css';

let myChart = null;

const GraphModal = ({ isOpen, onClose, title }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const centerNodeName = title || 'Current Focus';

    const initChart = () => {
      if (!myChart) {
        myChart = echarts.init(containerRef.current);
      }
      renderGraph(centerNodeName);
    };

    // 延迟确保容器尺寸已计算
    const t = setTimeout(initChart, 100);
    return () => clearTimeout(t);
  }, [isOpen, title]);

  useEffect(() => {
    const handleResize = () => {
      if (myChart) myChart.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="graph-modal" onClick={onClose}>
      <div className="graph-panel" onClick={(e) => e.stopPropagation()}>
        <div className="graph-head">
          <div>
            <h3>🕸️ Technology Evolution Graph</h3>
            <p>Mapping Semantic Lineage & Core Dependencies</p>
          </div>
          <button type="button" onClick={onClose} className="graph-close-btn" aria-label="Close">
            ✕
          </button>
        </div>

        <div ref={containerRef} id="echarts-graph-container" className="graph-canvas" />

        <div className="graph-legend">
          <span><span className="dot base" /> Fundamental Research</span>
          <span><span className="dot center" /> Current Focus</span>
          <span><span className="dot next" /> Derived Applications</span>
        </div>
      </div>
    </div>
  );
};

function renderGraph(centerNodeName) {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}',
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 1000,
          edgeLength: 120,
        },
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 13,
        },
        data: [
          {
            name: centerNodeName,
            symbolSize: 55,
            itemStyle: { color: '#6366f1' },
            label: { fontSize: 14, fontWeight: 'bold' },
          },
          {
            name: 'Core Foundation Theory',
            symbolSize: 35,
            itemStyle: { color: '#f87171' },
          },
          {
            name: 'Previous SOTA Model',
            symbolSize: 30,
            itemStyle: { color: '#f87171' },
          },
          {
            name: 'Future Application 1',
            symbolSize: 25,
            itemStyle: { color: '#34d399' },
          },
        ],
        edges: [
          {
            source: 'Core Foundation Theory',
            target: centerNodeName,
            lineStyle: { width: 2, curveness: 0.2 },
          },
          {
            source: 'Previous SOTA Model',
            target: centerNodeName,
            lineStyle: { width: 2, curveness: 0.2 },
          },
          {
            source: centerNodeName,
            target: 'Future Application 1',
            lineStyle: { width: 2, curveness: 0.2, type: 'dashed' },
          },
        ],
        lineStyle: {
          color: 'source',
          curveness: 0.3,
          opacity: 0.7,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 },
        },
      },
    ],
  };

  if (myChart) myChart.setOption(option);
}

export default GraphModal;
