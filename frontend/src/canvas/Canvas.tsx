import React, { useRef, useCallback, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { CanvasDefs } from './CanvasDefs';
import { GridBackground } from './GridBackground';
import { LayerBand } from './LayerBand';
import { NodeCard } from './NodeCard';
import { EdgePath } from './EdgePath';
import { SequenceBadge } from './SequenceBadge';
import { MetricPill } from './MetricPill';
import { computeAnchors } from '../lib/anchors';
import { route } from '../lib/route';
import { computeStepMarker } from '../lib/stepMarker';
import { layerOpacity } from '../lib/layerOpacity';
import { gridNodePosition } from '../lib/layout/computeLayout';
import { COLORS, FONT_MONO, LAYER_IDS, layerColorByIndex } from '../theme/tokens';
import { COLS, LAYERS_Y, VIEW_W, NODE_H } from '../lib/geometry';
import { GraphData, LayerData } from '../api/types';

interface CanvasProps {
  graph?: GraphData;
  layers?: LayerData[];
  activeLayerIndex?: number;
  unlockedIndex?: number;
  zoom?: number;
  animLayerIndex?: number;
  tracePath?: string[];
  layoutNodes?: Record<string, { x: number; y: number }>;
  sessionId?: string;
  isChatOpen?: boolean;
}

// Fallback hardcoded UI ref data for Phase 4a standalone preview
const HARDCODED_REF_DATA = {
  layers: [
    { index: 0, id: 'data', name: 'Data', band_label: 'LAYER 01 — DATA', y: 110,
      nodes: [
        { id: 'pg', col: 0, type: 'db', title: 'Postgres 16', sub: 'primary order store', icon_key: 'db.relational', origin: 'stated' },
        { id: 'cdc', col: 1, type: 'queue', title: 'Change Stream', sub: 'logical replication', icon_key: 'q.stream', origin: 'stated' },
        { id: 'wh', col: 2, type: 'db', title: 'Snowflake', sub: 'analytics warehouse', icon_key: 'db.warehouse', origin: 'stated' },
      ],
      edges: [
        { id: 'e_pg_cdc', a: 'pg', b: 'cdc', transport: 'replication', label: 'logical replication', sequence: 1, metric: null as string | null },
        { id: 'e_cdc_wh', a: 'cdc', b: 'wh', transport: 'async', label: 'stream to warehouse', sequence: 2, metric: null as string | null },
      ]
    },
    { index: 1, id: 'api', name: 'API', band_label: 'LAYER 02 — API', y: 400,
      nodes: [
        { id: 'gw', col: 0, type: 'svc', title: 'Edge Gateway', sub: 'auth + rate limits', icon_key: 'svc.gateway', origin: 'stated' },
        { id: 'ledger', col: 1, type: 'svc', title: 'Ledger API', sub: 'double-entry writes', icon_key: 'svc.generic', origin: 'stated' },
        { id: 'stripe', col: 2, type: 'ext', title: 'Stripe', sub: 'payments provider', icon_key: 'ext.payment', origin: 'stated' },
      ],
      edges: [
        { id: 'e_gw_ledger', a: 'gw', b: 'ledger', transport: 'sync', label: 'payment request', sequence: 1, metric: null as string | null },
        { id: 'e_ledger_stripe', a: 'ledger', b: 'stripe', transport: 'sync', label: 'settlement', sequence: 2, metric: null as string | null },
        { id: 'e_ledger_pg', a: 'ledger', b: 'pg', transport: 'sync', label: 'write order', sequence: undefined, metric: null as string | null },
      ]
    },
    { index: 2, id: 'infra', name: 'Infra', band_label: 'LAYER 03 — INFRA', y: 690,
      nodes: [
        { id: 'fastly', col: 0, type: 'infra', title: 'Fastly Edge', sub: 'TLS, cache, WAF', icon_key: 'infra.cloud', origin: 'stated' },
        { id: 'eks', col: 1, type: 'infra', title: 'EKS us-east-1', sub: '12 nodes, 3 AZs', icon_key: 'infra.container', origin: 'stated' },
        { id: 'obs', col: 2, type: 'infra', title: 'Grafana Cloud', sub: 'metrics, traces, logs', icon_key: 'infra.observability', origin: 'stated' },
      ],
      edges: [
        { id: 'e_fastly_eks', a: 'fastly', b: 'eks', transport: 'sync', label: 'route traffic', sequence: 1, metric: null as string | null },
        { id: 'e_eks_obs', a: 'eks', b: 'obs', transport: 'async', label: 'telemetry', sequence: 2, metric: null as string | null },
        { id: 'e_eks_gw', a: 'eks', b: 'gw', transport: 'sync', label: 'runs gateway pod', sequence: undefined, metric: null as string | null },
      ]
    }
  ]
};

export const Canvas: React.FC<CanvasProps> = ({
  graph,
  layers,
  activeLayerIndex = 0,
  unlockedIndex = 0,
  zoom = 100,
  animLayerIndex = -1,
  tracePath = [],
  layoutNodes,
  sessionId,
  isChatOpen = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Drag-to-pan state ──
  // panX / panY are offsets in SVG units applied to the diagram group.
  // On mousedown we record the start position, then on mousemove we compute
  // the delta in px and convert to SVG units (px × VIEW_W / containerWidth).
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan with left button, not on buttons/links
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button,a')) return;
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: panX, py: panY };
    setIsDragging(true);
    e.preventDefault();
  }, [panX, panY]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const el = containerRef.current;
      if (!el) return;
      // Convert px delta → SVG units
      const svgScale = VIEW_W / el.clientWidth;
      const dx = (e.clientX - dragStart.current.mx) * svgScale;
      const dy = (e.clientY - dragStart.current.my) * svgScale;
      setPanX(dragStart.current.px - dx);
      setPanY(dragStart.current.py - dy);
    };
    const onUp = () => {
      dragging.current = false;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── Build source layers ──
  const sourceLayers = (layers && layers.length > 0)
    ? layers.map(l => ({
        index: l.index,
        label: l.band_label,
        y: LAYERS_Y[l.index] ?? (110 + l.index * 290),
        edgeList: graph ? graph.connections.filter(c => c.layer_index === l.index).map(c => ({ id: c.id, a: c.source, b: c.target, transport: c.transport, label: c.label, sequence: c.sequence, metric: c.metric })) : []
      }))
    : HARDCODED_REF_DATA.layers.map(l => ({
        index: l.index,
        label: l.band_label,
        y: l.y,
        edgeList: l.edges
      }));

  const totalNodeCount = graph ? graph.nodes.length : 0;
  const totalEdgeCount = graph ? graph.connections.length : sourceLayers.reduce((n, l) => n + l.edgeList.length, 0);
  const totalLayerCount = sourceLayers.length || 3;

  // ── Calculate node geometry first ──
  const geomMap: Record<string, { id: string; x: number; y: number; type: string; title: string; sub: string; iconKey: string; origin: string; li: number }> = {};

  if (graph && layers && layers.length > 0) {
    layers.forEach((layer) => {
      layer.node_ids.forEach((nid, idx) => {
        const nodeObj = graph.nodes.find(n => n.id === nid);
        if (nodeObj) {
          const customPos = layoutNodes?.[nid];
          const gridPos = gridNodePosition(idx, layer.node_ids.length, layer.index);
          geomMap[nid] = {
            id: nid,
            x: customPos ? customPos.x : gridPos.x,
            y: customPos ? customPos.y : gridPos.y,
            type: nodeObj.type,
            title: nodeObj.label,
            sub: nodeObj.subtitle || '',
            iconKey: nodeObj.icon_key,
            origin: nodeObj.provenance?.origin || 'stated',
            li: layer.index,
          };
        }
      });
    });
  } else {
    // Use hardcoded UI ref data
    HARDCODED_REF_DATA.layers.forEach((layer) => {
      layer.nodes.forEach((n) => {
        geomMap[n.id] = {
          id: n.id,
          x: COLS[n.col],
          y: layer.y,
          type: n.type,
          title: n.title,
          sub: n.sub,
          iconKey: n.icon_key,
          origin: n.origin,
          li: layer.index,
        };
      });
    });
  }

  // ── Calculate dynamic diagram width to prevent right-side clipping ──
  let maxRight = 1030;
  Object.values(geomMap).forEach(n => {
    if (n.x + NODE_H + 280 > maxRight) {
      maxRight = n.x + NODE_H + 280;
    }
  });
  sourceLayers.forEach(l => {
    l.edgeList.forEach(e => {
      const A = geomMap[e.a];
      const B = geomMap[e.b];
      if (A && B) {
        const maxX = Math.max(A.x, B.x) + 300;
        if (maxX > maxRight) maxRight = maxX;
      }
    });
  });
  const DIAGRAM_W = Math.max(1030, maxRight);

  // ── Mouse drag pan handler ──
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const el = containerRef.current;
      if (!el) return;
      const svgScale = DIAGRAM_W / el.clientWidth;
      const dx = (e.clientX - dragStart.current.mx) * svgScale;
      const dy = (e.clientY - dragStart.current.my) * svgScale;
      setPanX(dragStart.current.px - dx);
      setPanY(dragStart.current.py - dy);
    };
    const onUp = () => {
      dragging.current = false;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [DIAGRAM_W]);

  // ── Scrollable full-diagram viewBox ──
  const lastLayerY = sourceLayers.length > 0 ? sourceLayers[sourceLayers.length - 1].y : 690;
  const DIAGRAM_TOP = 50;                        // breathing room above layer 01
  const DIAGRAM_BOT = lastLayerY + NODE_H + 100; // generous padding below last layer
  const DIAGRAM_H   = DIAGRAM_BOT - DIAGRAM_TOP;
  const viewBox = `0 ${DIAGRAM_TOP} ${DIAGRAM_W} ${DIAGRAM_H}`;

  // Zoom + pan transform: scale around center, then shift by pan offset
  const scale = zoom / 100;
  const cx = DIAGRAM_W / 2;
  const cy = DIAGRAM_TOP + DIAGRAM_H / 2;
  const zoomTransform = `translate(${cx},${cy}) scale(${scale}) translate(-${cx},-${cy}) translate(${-panX},${-panY})`;

  // SVG aspect ratio for the padding-bottom intrinsic-size trick
  const svgAspect = DIAGRAM_H / DIAGRAM_W;

  // ── PNG download: captures the full rendered diagram ──
  const downloadPng = useCallback(async () => {
    const scrollEl = containerRef.current;
    if (!scrollEl) return;
    const targetEl = (scrollEl.firstElementChild as HTMLElement) || scrollEl;

    const prevScrollTop = scrollEl.scrollTop;
    const prevScrollLeft = scrollEl.scrollLeft;
    scrollEl.scrollTop = 0;
    scrollEl.scrollLeft = 0;

    try {
      const canvas = await html2canvas(targetEl, {
        backgroundColor: '#080a14',
        scale: 2,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: targetEl.offsetWidth,
        height: targetEl.offsetHeight,
      });

      scrollEl.scrollTop = prevScrollTop;
      scrollEl.scrollLeft = prevScrollLeft;

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(sessionId || 'architecture').slice(0, 16)}-full-diagram.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      scrollEl.scrollTop = prevScrollTop;
      scrollEl.scrollLeft = prevScrollLeft;
      console.error('PNG export failed:', err);
    }
  }, [sessionId]);

  // ── Build render arrays ──
  const renderedLayers: React.ReactNode[] = [];

  sourceLayers.forEach((layer) => {
    const op = layerOpacity(layer.index, activeLayerIndex, unlockedIndex);
    if (op === 0) return;

    const isActive = layer.index === activeLayerIndex;
    const isLocked = layer.index > unlockedIndex;
    const color = layerColorByIndex(layer.index);
    const layerId = LAYER_IDS[layer.index] || 'infra';

    const depthScale = isActive ? 1 : isLocked ? 0.93 : 0.965;
    const depthBlur = isActive ? 'none' : isLocked ? 'blur(2px) saturate(.4)' : 'blur(.7px) saturate(.75)';

    const bandNodes: React.ReactNode[] = [];
    const bandEdges: React.ReactNode[] = [];
    const bandSteps: React.ReactNode[] = [];

    // Nodes in layer
    Object.values(geomMap)
      .filter(n => n.li === layer.index)
      .forEach(n => {
        bandNodes.push(
          <NodeCard
            key={n.id}
            x={n.x}
            y={n.y}
            title={n.title}
            sub={n.sub}
            type={n.type}
            iconKey={n.iconKey}
            opacity={1}
            origin={n.origin as any}
            isAnimating={layer.index === animLayerIndex}
            layerColor={color}
          />
        );
      });

    // Edges in layer
    layer.edgeList.forEach(e => {
      const A = geomMap[e.a];
      const B = geomMap[e.b];
      if (!A || !B) return;
      const sameRow = Math.abs(A.y - B.y) < 1;
      const { from, to } = computeAnchors(A, B);
      const d = route(from, to);
      const isTraced = tracePath.includes(e.id);
      const isBidirectional = e.transport === 'bidirectional';
      const marker = computeStepMarker(from, to, sameRow);
      const displayLabel = e.label || (e.transport !== 'sync' ? e.transport : null);

      bandEdges.push(
        <EdgePath
          key={e.id}
          d={d}
          color={color}
          layerId={layerId}
          transport={e.transport}
          opacity={1}
          isTraced={isTraced}
          isRevealing={layer.index === animLayerIndex}
          isBidirectional={isBidirectional}
          label={displayLabel}
          labelPos={{ x: marker.x, y: marker.y - 46 }}
        />
      );

      if (e.sequence) {
        bandSteps.push(
          <SequenceBadge
            key={`step-${e.id}`}
            x={marker.x}
            y={marker.y}
            bx={marker.bx}
            by={marker.by}
            n={e.sequence}
            color={color}
            opacity={1}
            isAnimating={layer.index === animLayerIndex}
          />
        );
      }

      if (e.metric) {
        bandSteps.push(
          <MetricPill
            key={`metric-${e.id}`}
            x={marker.x}
            y={marker.y + 48}
            text={e.metric}
            color={color}
            opacity={1}
          />
        );
      }
    });

    renderedLayers.push(
      <g
        key={`layer-${layer.index}`}
        opacity={op}
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center',
          transform: `scale(${depthScale})`,
          filter: depthBlur,
          transition: 'opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1), filter .6s ease',
        } as React.CSSProperties}
      >
        <LayerBand x={COLS[0]} y={layer.y} label={layer.label} opacity={1} isActive={isActive} color={color} width={DIAGRAM_W} />
        {bandEdges}
        {bandSteps}
        {bandNodes}
      </g>
    );
  });

  return (
    // Outer non-scrolling wrapper — outerRef for html2canvas, chips anchored here
    <div
      ref={outerRef}
      style={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        height: '100%',
        borderRadius: 18,
        background: 'radial-gradient(90% 60% at 50% 22%, rgba(146,166,255,.11), transparent 60%), linear-gradient(180deg, #0c1022, #080a14 70%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), 0 24px 60px rgba(0,0,0,.5)',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable + draggable inner area */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(146,166,255,.25) transparent',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        } as React.CSSProperties}
      >
        {/* Padding-bottom aspect-ratio trick: makes SVG intrinsically sized */}
        <div style={{ position: 'relative', width: '100%', paddingBottom: `${svgAspect * 100}%` }}>
          <GridBackground style={{ position: 'absolute', inset: 0 }} />
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMin meet"
            style={{ position: 'absolute', inset: 0 }}
          >
            <CanvasDefs />
            <g transform={zoomTransform}>
              {renderedLayers}
            </g>
          </svg>
        </div>
      </div>

      {/* ── Overlay chips — sit on the outer wrapper so they never scroll away ── */}

      {/* PNG download button */}
      <button
        onClick={downloadPng}
        title="Download active layer as PNG"
        style={{
          position: 'absolute',
          left: 20,
          top: 20,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 12px',
          borderRadius: 10,
          background: 'rgba(10,13,26,.72)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07), 0 16px 40px rgba(0,0,0,.45)',
          border: 0,
          cursor: 'pointer',
          fontFamily: FONT_MONO,
          fontSize: 9,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          color: COLORS.textSecondary,
        }}
      >
        <svg width="11" height="12" viewBox="0 0 12 14">
          <path d="M6 0v9M2.5 6.5L6 10l3.5-3.5M0.5 12.5h11" stroke="currentColor" strokeWidth={1.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        PNG
      </button>

      {/* Legend chip */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          bottom: 20,
          zIndex: 10,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          padding: '9px 14px',
          borderRadius: 12,
          background: 'rgba(10,13,26,.7)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07)',
          fontFamily: FONT_MONO,
          fontSize: 8,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          color: COLORS.textDim,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="26" height="6"><path d="M1 3h24" stroke="#b6bcdd" strokeWidth={1.6} strokeLinecap="round" /></svg>
          sync
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="26" height="6"><path d="M1 3h24" stroke="#b6bcdd" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="2 7" /></svg>
          async
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="26" height="10"><path d="M1 3h24M1 7h20" stroke="#b6bcdd" strokeWidth={1.6} strokeLinecap="round" /></svg>
          replication
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="#b6bcdd" /></svg>
          step
        </span>
      </div>

      {/* Stats chip */}
      <div
        style={{
          position: 'absolute',
          right: isChatOpen ? 440 : 20,
          bottom: 20,
          zIndex: 10,
          padding: '12px 16px',
          borderRadius: 14,
          background: 'rgba(10,13,26,.72)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07), 0 16px 40px rgba(0,0,0,.45)',
          fontFamily: FONT_MONO,
          fontSize: 8.5,
          color: COLORS.textDim,
          display: 'flex',
          gap: 22,
          transition: 'right .28s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        {sessionId && (
          <div>
            <div style={{ color: COLORS.textGhost, marginBottom: 5 }}>SESSION</div>
            {sessionId.slice(0, 8)}
          </div>
        )}
        <div>
          <div style={{ color: COLORS.textGhost, marginBottom: 5 }}>NODES</div>
          {totalNodeCount} / {String(totalEdgeCount).padStart(2, '0')} edges
        </div>
        <div>
          <div style={{ color: COLORS.textGhost, marginBottom: 5 }}>DEPTH</div>
          layer {String(activeLayerIndex + 1).padStart(2, '0')} of {totalLayerCount}
        </div>
      </div>
    </div>
  );
};
