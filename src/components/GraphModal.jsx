import React, { useEffect, useRef, useState } from 'react';
import './GraphModal.css';
import axios from 'axios';
import cytoscape from 'cytoscape';

function applyRadialLayout(cy, centerId) {
  if (!cy || !centerId) return;
  const R1 = 130;
  const R2 = 260;
  const radiusJitter = 35;
  const angleJitter = 0.35;
  const globalRotation = Math.random() * 2 * Math.PI;
  const byDepth = { 0: [], 1: [], 2: [] };
  cy.nodes().forEach((node) => {
    const d = node.data('depth');
    if (d === 0) byDepth[0].push(node);
    else if (d === 1) byDepth[1].push(node);
    else byDepth[2].push(node);
  });
  byDepth[0].forEach((node) => node.position({ x: 0, y: 0 }));
  [byDepth[1], byDepth[2]].forEach((list, idx) => {
    const baseR = idx === 0 ? R1 : R2;
    const n = list.length;
    list.forEach((node, i) => {
      let angle = n <= 1 ? Math.random() * 2 * Math.PI : (2 * Math.PI * i) / n - Math.PI / 2;
      angle += (Math.random() - 0.5) * 2 * angleJitter;
      const r = baseR + (Math.random() - 0.5) * 2 * radiusJitter;
      let x = r * Math.cos(angle);
      let y = r * Math.sin(angle);
      const cos = Math.cos(globalRotation);
      const sin = Math.sin(globalRotation);
      node.position({ x: x * cos - y * sin, y: x * sin + y * cos });
    });
  });
  cy.resize();
  const centerNode = cy.getElementById(centerId);
  if (centerNode.length) {
    cy.fit(centerNode, 80);
    cy.center(centerNode);
  } else {
    cy.fit(80);
    cy.center();
  }
}

const GraphModal = ({ isOpen, onClose, title, nodeId = null, fixedMaxNodes = null }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const shuffleLayoutRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState({ title: '', summary: '', x: 0, y: 0, visible: false });
  const hoverTimerRef = useRef(null);
  const globalGraphRef = useRef(null);
  const [noDataMessage, setNoDataMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    // Destroy previous Cytoscape instance so we don't reuse one bound to unmounted DOM
    if (cyRef.current) {
      try {
        cyRef.current.destroy();
      } catch (e) {
        // ignore
      }
      cyRef.current = null;
    }
    globalGraphRef.current = null;

    async function fetchAndRender() {
      setLoading(true);
      try {
        if (!globalGraphRef.current) {
          try {
            console.log('GraphModal: Fetching global graph from /api/v1/graph/global');
            const res = await axios.get('http://localhost:8000/api/v1/graph/global');
            console.log('GraphModal: Received response:', { nodes: res.data?.nodes?.length || 0, edges: res.data?.edges?.length || 0 });
            globalGraphRef.current = res.data || { nodes: [], edges: [] };
          } catch (err) {
            console.error('GraphModal: failed to fetch global graph', err);
            setNoDataMessage('Failed to load graph (backend not responding). Please ensure the backend is running.');
            setLoading(false);
            return;
          }
        }
        if (cancelled) return;
        const graph = globalGraphRef.current;
        console.log('GraphModal: Using graph with', graph.nodes.length, 'nodes and', graph.edges.length, 'edges');
        const nodeMap = new Map();
        graph.nodes.forEach((n) => nodeMap.set(n.id, n));

        const adj = new Map();
        const edgeList = [];
        (graph.edges || []).forEach((e, idx) => {
          if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) return;
          edgeList.push({ data: { id: `${e.source}-${e.target}-${idx}`, source: e.source, target: e.target, score: e.score } });
          if (!adj.has(e.source)) adj.set(e.source, []);
          if (!adj.has(e.target)) adj.set(e.target, []);
          adj.get(e.source).push({ id: e.target, score: e.score });
          adj.get(e.target).push({ id: e.source, score: e.score });
        });

        let centerId = nodeId;
        if (!centerId && title) {
          for (const n of graph.nodes) {
            if (n.title && n.title === title) { centerId = n.id; break; }
          }
        }

        const EGO_DEPTH = 2; // 0=center only, 1=center+neighbors, 2=+2-hop, etc.
        const MAX_NEIGHBORS_PER_NODE = 50;
        let filteredNodeIds = new Set();
        const edgeKeySet = new Set(); // dedupe undirected edges
        let filteredEdges = [];
        const centerDepthMap = {}; // nodeId -> BFS depth from center (for layout)

        if (centerId && nodeMap.has(centerId)) {
          const visited = new Set();
          const q = [{ id: centerId, depth: 0 }];
          visited.add(centerId);
          while (q.length > 0) {
            const cur = q.shift();
            filteredNodeIds.add(cur.id);
            centerDepthMap[cur.id] = cur.depth;
            if (cur.depth >= EGO_DEPTH) continue;
            const neighbors = (adj.get(cur.id) || [])
              .slice()
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .slice(0, MAX_NEIGHBORS_PER_NODE);
            for (const nb of neighbors) {
              if (!visited.has(nb.id)) {
                visited.add(nb.id);
                q.push({ id: nb.id, depth: cur.depth + 1 });
              }
              const key = [cur.id, nb.id].sort().join('--');
              if (!edgeKeySet.has(key)) {
                edgeKeySet.add(key);
                filteredEdges.push({ data: { id: `${cur.id}-${nb.id}-${filteredEdges.length}`, source: cur.id, target: nb.id, score: nb.score } });
              }
            }
          }
        } else {
          const connected = new Set();
          edgeList.forEach((e) => { connected.add(e.data.source); connected.add(e.data.target); });
          if (connected.size === 0) {
            const elements = [];
            if (graph.nodes.length > 0) {
              const rep = graph.nodes[0];
              elements.push({ data: { id: rep.id, label: rep.title } });
            }
            if (!cyRef.current) {
              cyRef.current = cytoscape({ container: containerRef.current, elements, style: [
                { selector: 'node', style: { label: '', 'background-color': '#2b6cb0', 'border-color': '#ffffff', 'border-width': 2, width: 12, height: 12 } },
                { selector: 'edge', style: { 'line-color': '#cbd5e1', width: 2, opacity: 0.9 } },
                { selector: 'node:hover', style: { width: 16, height: 16 } },
              ], layout: { name: 'cose', animate: true, animationDuration: 400 } });
            } else {
              const cy = cyRef.current; cy.startBatch(); cy.elements().remove(); cy.add(elements); cy.endBatch();
            }
            try { cyRef.current.resize(); cyRef.current.fit(); cyRef.current.center(); } catch (e) {}
            return;
          }

          const adjSimple = new Map();
          edgeList.forEach((e) => {
            const s = e.data.source; const t = e.data.target;
            if (!adjSimple.has(s)) adjSimple.set(s, new Set());
            if (!adjSimple.has(t)) adjSimple.set(t, new Set());
            adjSimple.get(s).add(t); adjSimple.get(t).add(s);
          });
          const visited = new Set(); const comps = [];
          for (const nid of connected) {
            if (visited.has(nid)) continue;
            const comp = new Set(); const q2 = [nid]; visited.add(nid);
            while (q2.length) {
              const c = q2.shift(); comp.add(c);
              for (const nb of (adjSimple.get(c) || [])) {
                if (!visited.has(nb)) { visited.add(nb); q2.push(nb); }
              }
            }
            comps.push(comp);
          }
          comps.sort((a, b) => b.size - a.size);
          const largest = comps[0] || new Set();
          filteredNodeIds = new Set(Array.from(largest));
          filteredEdges = edgeList.filter((e) => filteredNodeIds.has(e.data.source) && filteredNodeIds.has(e.data.target));
        }

        const elements = [];
        const filteredNodes = graph.nodes.filter((n) => filteredNodeIds.has(n.id));
        if (filteredNodes.length === 0 && filteredEdges.length === 0) {
          console.warn('GraphModal: No nodes or edges found in filtered ego-graph');
          setNoDataMessage('No graph data found for this paper.');
        } else {
          console.log('GraphModal: Ego-graph extracted with', filteredNodes.length, 'nodes and', filteredEdges.length, 'edges');
          setNoDataMessage('');
        }
        const hasCenter = centerId && nodeMap.has(centerId);
        filteredNodes.forEach((n) => {
          const data = { id: n.id, label: n.title, summary: n.summary || n.abstract || '' };
          if (hasCenter && centerDepthMap[n.id] !== undefined) data.depth = centerDepthMap[n.id];
          elements.push({ data });
        });
        filteredEdges.forEach((e, idx) => elements.push({ data: { id: `${e.data.source}-${e.data.target}-${idx}`, source: e.data.source, target: e.data.target, score: e.data.score } }));

        const layoutOpts = hasCenter
          ? null // we apply radial layout manually below
          : { name: 'cose', nodeRepulsion: 8000, idealEdgeLength: 80, animate: true, animationDuration: 400 };

        const nodeStyles = [
          { selector: 'node', style: { label: '', 'background-color': '#7dd3fc', 'border-color': '#0ea5e9', 'border-width': 2, width: 12, height: 12 } },
          { selector: 'node[depth=0]', style: { width: 28, height: 28, 'background-color': '#38bdf8', 'border-width': 3, 'border-color': '#fff' } },
          { selector: 'node[depth=1]', style: { width: 18, height: 18 } },
          { selector: 'node[depth=2]', style: { width: 12, height: 12 } },
          { selector: 'edge', style: { 'line-color': '#bae6fd', width: 1.5, opacity: 0.85 } },
          { selector: 'node:selected', style: { 'background-color': '#f97316', width: 20, height: 20 } },
          { selector: 'node.hover', style: { 'background-color': '#f43f5e', width: 16, height: 16 } },
        ];

        if (!cyRef.current) {
          console.log('GraphModal: Initializing Cytoscape with', elements.length, 'elements');
          cyRef.current = cytoscape({ container: containerRef.current, elements, style: nodeStyles });

          cyRef.current.on('mouseover', 'node', (evt) => {
            const n = evt.target; n.addClass('hover');
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            const pos = evt.renderedPosition || { x: 0, y: 0 };
            const rect = containerRef.current.getBoundingClientRect();
            const x = rect.left + pos.x + 8; const y = rect.top + pos.y + 8;
            const title = (n.data('label') || '').toString().replace(/\s+/g, ' ').slice(0, 170);
            const summaryRaw = n.data('summary') || n.data('abstract') || n.data('snippet') || '';
            const summary = summaryRaw.toString().replace(/\s+/g, ' ').slice(0, 240);
            hoverTimerRef.current = setTimeout(() => {
              setTooltip({ title, summary, x, y, visible: true });
              hoverTimerRef.current = null;
            }, 200);
          });
          cyRef.current.on('mousemove', 'node', (evt) => {
            const pos = evt.renderedPosition || { x: 0, y: 0 };
            const rect = containerRef.current.getBoundingClientRect();
            setTooltip((t) => ({ ...t, x: rect.left + pos.x + 8, y: rect.top + pos.y + 8 }));
          });
          cyRef.current.on('mouseout', 'node', (evt) => {
            const n = evt.target; n.removeClass('hover');
            if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
            setTooltip({ title: '', summary: '', x: 0, y: 0, visible: false });
          });
          cyRef.current.on('tap', 'node', (evt) => { const n = evt.target; window.open(`/papers/${n.id()}`, '_blank'); });
        } else {
          const cy = cyRef.current; cy.startBatch(); cy.elements().remove(); cy.add(elements); cy.endBatch();
        }

        const cy = cyRef.current;

        if (hasCenter && centerId) {
          applyRadialLayout(cy, centerId);
          shuffleLayoutRef.current = () => applyRadialLayout(cyRef.current, centerId);
        } else {
          shuffleLayoutRef.current = null;
          cy.layout(layoutOpts).run().then(() => {
            if (cancelled) return;
            try {
              cy.resize();
              cy.fit(50);
              cy.center();
            } catch (e) {}
          }).catch(() => {});
        }

      } catch (err) {
        // ignore per existing behaviour
      } finally { if (!cancelled) setLoading(false); }
    }

    fetchAndRender().catch(() => {});

    return () => { cancelled = true; if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; } };
  }, [isOpen, nodeId, title, fixedMaxNodes]);

  if (!isOpen) return null;

  return (
    <div className="graph-modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="graph-panel" onClick={(e) => e.stopPropagation()}>
        <header className="graph-head">
          <div>
            <h3>{title || 'Knowledge Graph'}</h3>
            <p>Similarity graph (click node to open paper) · Drag to pan, scroll to zoom</p>
          </div>
          <div className="graph-head-actions">
            <button type="button" className="graph-btn-secondary" onClick={() => shuffleLayoutRef.current?.()}>Shuffle layout</button>
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </header>
        <div className="graph-canvas">
          {loading ? <div className="graph-loader">Loading graph…</div> : null}
          <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 320 }} />
          {tooltip.visible ? (
            <div
              className="cy-tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
              role="tooltip"
              aria-hidden={!tooltip.visible}
            >
              <div className="tt-title">{tooltip.title}</div>
              {tooltip.summary ? <div className="tt-summary">{tooltip.summary}</div> : null}
            </div>
          ) : null}
        </div>
        {noDataMessage ? (
          <div className="graph-fallback-notice" role="status">{noDataMessage}</div>
        ) : null}
      </div>
    </div>
  );
};

export default GraphModal;
