import React from 'react';
import { FAMILIES } from '../icons/families';
import { COLORS } from '../theme/tokens';

const ARROW_TYPES = ['db', 'svc', 'queue', 'infra', 'ext'] as const;
const TYPE_COLORS: Record<string, string> = {
  db: COLORS.types.db,
  svc: COLORS.types.svc,
  queue: COLORS.types.queue,
  infra: COLORS.types.infra,
  ext: COLORS.types.ext,
};

export const CanvasDefs: React.FC = () => {
  return (
    <defs>
      {/* ── Node shadow ──────────────────────────────────────────────────── */}
      <filter id="nodeShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#000000" floodOpacity="0.55" />
      </filter>

      {/* ── Edge glow filter ─────────────────────────────────────────────── */}
      {ARROW_TYPES.map(t => (
        <filter key={`glow-${t}`} id={`glow-${t}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor={TYPE_COLORS[t]} floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}

      {/* ── Arrow markers (open chevron, sharper look) ────────────────────── */}
      {ARROW_TYPES.map(t => (
        <React.Fragment key={t}>
          {/* Solid arrowhead */}
          <marker
            id={`ar-${t}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path
              d="M0 1L9 5L0 9L2.5 5Z"
              fill={TYPE_COLORS[t]}
            />
          </marker>
          {/* Traced/highlighted arrowhead (brighter) */}
          <marker
            id={`ar-${t}-traced`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path
              d="M0 1L9 5L0 9L2.5 5Z"
              fill={TYPE_COLORS[t]}
              filter={`url(#glow-${t})`}
            />
          </marker>
          {/* Bidirectional — source end open circle */}
          <marker
            id={`ar-${t}-start`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <circle cx="5" cy="5" r="3" fill="none" stroke={TYPE_COLORS[t]} strokeWidth="1.5" />
          </marker>
        </React.Fragment>
      ))}

      {/* ── Edge gradient definitions (horizontal, per-type) ──────────────── */}
      {ARROW_TYPES.map(t => (
        <linearGradient key={`edgegrad-${t}`} id={`edgegrad-${t}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={TYPE_COLORS[t]} stopOpacity="0.25" />
          <stop offset="50%" stopColor={TYPE_COLORS[t]} stopOpacity="0.9" />
          <stop offset="100%" stopColor={TYPE_COLORS[t]} stopOpacity="0.55" />
        </linearGradient>
      ))}

      {/* ── Tile gradient fills ───────────────────────────────────────────── */}
      {FAMILIES.map(fam => (
        <linearGradient
          key={fam.id}
          id={`grad-${fam.id}`}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientTransform="rotate(65 .5 .5)"
        >
          <stop offset="0%" stopColor={fam.light} />
          <stop offset="46%" stopColor={fam.color} />
          <stop offset="100%" stopColor={fam.dark} />
        </linearGradient>
      ))}
    </defs>
  );
};
