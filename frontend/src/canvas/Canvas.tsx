import React from 'react';
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
import { COLORS } from '../theme/tokens';
import { COLS, LAYERS_Y, VIEW_W, VIEW_H, NODE_H } from '../lib/geometry';
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
}) => {
  const activeY = LAYERS_Y[activeLayerIndex] ?? 110;
  const viewBox = `0 ${activeY + NODE_H / 2 - VIEW_H / 2} ${VIEW_W} ${VIEW_H}`;
  const scale = zoom / 100;
  const zoomTransform = `translate(${VIEW_W / 2},${activeY + NODE_H / 2}) scale(${scale}) translate(-${VIEW_W / 2},-${activeY + NODE_H / 2})`;

  // Calculate node geometry
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

  // Build render arrays
  const renderedBands: React.ReactNode[] = [];
  const renderedEdges: React.ReactNode[] = [];
  const renderedSteps: React.ReactNode[] = [];
  const renderedNodes: React.ReactNode[] = [];

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

  sourceLayers.forEach((layer) => {
    const op = layerOpacity(layer.index, activeLayerIndex, unlockedIndex);
    if (op === 0) return;

    // Layer Band
    renderedBands.push(
      <LayerBand
        key={`band-${layer.index}`}
        x={COLS[0]}
        y={layer.y}
        label={layer.label}
        opacity={op}
        isActive={layer.index === activeLayerIndex}
      />
    );

    // Nodes in layer
    Object.values(geomMap)
      .filter(n => n.li === layer.index)
      .forEach(n => {
        renderedNodes.push(
          <NodeCard
            key={n.id}
            x={n.x}
            y={n.y}
            title={n.title}
            sub={n.sub}
            type={n.type}
            iconKey={n.iconKey}
            opacity={op}
            origin={n.origin as any}
            isAnimating={layer.index === animLayerIndex}
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
      const color = COLORS.types[A.type] || COLORS.types.svc;
      const isTraced = tracePath.includes(e.id);
      const isBidirectional = e.transport === 'bidirectional';

      // One shared midpoint drives the sequence badge, the metric pill, and
      // the edge label, so they can be deliberately offset from each other
      // instead of three separate midpoint calculations landing on the same
      // spot and overlapping illegibly.
      const marker = computeStepMarker(from, to, sameRow);
      const displayLabel = e.label || (e.transport !== 'sync' ? e.transport : null);

      renderedEdges.push(
        <EdgePath
          key={e.id}
          d={d}
          color={color}
          nodeType={A.type}
          transport={e.transport}
          opacity={op}
          isTraced={isTraced}
          isRevealing={layer.index === animLayerIndex}
          isBidirectional={isBidirectional}
          label={displayLabel}
          // Same-row labels are often wider than the ~70px node gap they sit
          // in, so they float above the whole node row (clearing NODE_H/2 +
          // margin), not just above the sequence badge — otherwise a long
          // label like "logical replication" bleeds into the neighboring
          // node card even though it cleared the badge.
          labelPos={{ x: marker.x, y: marker.y - 46 }}
        />
      );

      // Sequence Badge — sits on the line itself
      if (e.sequence) {
        renderedSteps.push(
          <SequenceBadge
            key={`step-${e.id}`}
            x={marker.x}
            y={marker.y}
            bx={marker.bx}
            by={marker.by}
            n={e.sequence}
            color={color}
            opacity={op}
            isAnimating={layer.index === animLayerIndex}
          />
        );
      }

      // Metric Pill — below the line, mirroring the label's offset above it
      if (e.metric) {
        renderedSteps.push(
          <MetricPill
            key={`metric-${e.id}`}
            x={marker.x}
            y={marker.y + 48}
            text={e.metric}
            color={color}
            opacity={op}
          />
        );
      }
    });
  });

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, background: '#0f0f11', overflow: 'hidden', height: '100%' }}>
      <GridBackground />
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0 }}
      >
        <CanvasDefs />
        <g transform={zoomTransform}>
          {renderedBands}
          {renderedEdges}
          {renderedSteps}
          {renderedNodes}
        </g>
      </svg>
    </div>
  );
};
