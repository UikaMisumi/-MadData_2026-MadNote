import React, { useEffect, useRef, useState } from 'react';
import './GraphModal.css';
import axios from 'axios';
import cytoscape from 'cytoscape';

const GraphModal = ({ isOpen, onClose, title, fixedThreshold = null }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(() => (fixedThreshold ?? 0.5));
  const [maxNodes, setMaxNodes] = useState(100);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function fetchGraph() {
      setLoading(true);
      try {
        const effectiveThreshold = (fixedThreshold ?? threshold);
        const res = await axios.get('http://localhost:8000/api/v1/graph/similarity', {
          params: { threshold: effectiveThreshold, max_nodes: maxNodes },
        });
        if (cancelled) return;
        const graph = res.data || { nodes: [], edges: [] };

        const elements = [];
        const nodeMap = new Map();
        graph.nodes.forEach((n) => {
          nodeMap.set(n.id, n);
          elements.push({ data: { id: n.id, label: n.title } });
        });

        graph.edges.forEach((e, idx) => {
          if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
            elements.push({ data: { id: `${e.source}-${e.target}-${idx}`, source: e.source, target: e.target, score: e.score } });
          }
        });

        if (!cyRef.current) {
          cyRef.current = cytoscape({
            container: containerRef.current,
            elements,
            style: [
              { selector: 'node', style: { 'label': 'data(label)', 'background-color': '#2563EB', 'color': '#fff', 'text-valign': 'center', 'text-halign': 'center', 'width': 40, 'height': 40, 'font-size': 10 } },
              { selector: 'edge', style: { 'line-color': '#94a3b8', 'width': 2, 'opacity': 0.9 } },
              { selector: 'node:selected', style: { 'background-color': '#f97316', 'width': 56, 'height': 56 } },
              { selector: 'node.hover', style: { 'background-color': '#f43f5e', 'width': 52, 'height': 52 } },
            ],
            layout: { name: 'cose', animate: true, animationDuration: 800 },
          });

          cyRef.current.on('mouseover', 'node', (evt) => {
            const n = evt.target;
            n.addClass('hover');
          });
          cyRef.current.on('mouseout', 'node', (evt) => {
            const n = evt.target;
            n.removeClass('hover');
          });
          cyRef.current.on('tap', 'node', (evt) => {
            const n = evt.target;
            const id = n.id();
            window.open(`/papers/${id}`, '_blank');
          });
        } else {
          const cy = cyRef.current;
          cy.startBatch();
          cy.elements().remove();
          cy.add(elements);
          cy.endBatch();
          cy.layout({ name: 'cose', animate: true, animationDuration: 800 }).run();
        }
      } catch (err) {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGraph();

    return () => {
      cancelled = true;
    };
  }, [isOpen, threshold, maxNodes]);

  useEffect(() => {
    return () => {
      if (cyRef.current) {
        try { cyRef.current.destroy(); } catch (e) {}
        cyRef.current = null;
      }
    };
  }, []);

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

        <div className="graph-controls">
          {fixedThreshold != null ? (
            <label>Threshold: {fixedThreshold.toFixed(2)} (fixed)</label>
          ) : (
            <>
              <label>Threshold: {threshold.toFixed(2)}</label>
              <input type="range" min="0" max="1" step="0.01" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
            </>
          )}

          <label>Max nodes: {maxNodes}</label>
          <input type="number" min="10" max="1000" step="10" value={maxNodes} onChange={(e) => setMaxNodes(parseInt(e.target.value || '100', 10))} />
        </div>

        <div className="graph-canvas">
          {loading && <div className="graph-loader">Loading graph…</div>}
          <div ref={containerRef} id="cy" style={{ width: '100%', height: '100%' }} aria-label="Knowledge graph" />
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
