import React from 'react';
import { FAMILIES } from '../icons/families';
import { COLORS, LAYER_IDS } from '../theme/tokens';

const LAYER_COLORS: Record<string, string> = {
  data: COLORS.layers.data,
  api: COLORS.layers.api,
  infra: COLORS.layers.infra,
};

export const CanvasDefs: React.FC = () => {
  return (
    <defs>
      {/* ── Slab fill for node cards ─────────────────────────────────────── */}
      <linearGradient id="slab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={COLORS.slabTop} />
        <stop offset="1" stopColor={COLORS.slabBottom} />
      </linearGradient>

      {/* ── Drop shadow for slabs ─────────────────────────────────────────── */}
      <filter id="nodeShadow" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="#03040a" floodOpacity=".7" />
      </filter>

      {/* ── Soft glow ellipse blur (under "stated" node slabs) ─────────────── */}
      <filter id="softGlow" x="-60%" y="-200%" width="220%" height="500%">
        <feGaussianBlur stdDeviation="6" />
      </filter>

      {/* ── Edge glow filter, one per layer ─────────────────────────────────── */}
      {LAYER_IDS.map(id => (
        <filter key={`glow-${id}`} id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor={LAYER_COLORS[id]} floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}

      {/* ── Arrow markers, one set per layer ────────────────────────────────── */}
      {LAYER_IDS.map(id => (
        <React.Fragment key={id}>
          <marker id={`ar-${id}`} viewBox="0 0 9 9" refX="7.5" refY="4.5" markerWidth="6" markerHeight="6" orient="auto">
            <circle cx="4.5" cy="4.5" r="3.4" fill={LAYER_COLORS[id]} />
          </marker>
          <marker id={`ar-${id}-traced`} viewBox="0 0 9 9" refX="7.5" refY="4.5" markerWidth="7" markerHeight="7" orient="auto">
            <circle cx="4.5" cy="4.5" r="3.6" fill={LAYER_COLORS[id]} filter={`url(#glow-${id})`} />
          </marker>
          <marker id={`ar-${id}-start`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <circle cx="5" cy="5" r="3" fill="none" stroke={LAYER_COLORS[id]} strokeWidth="1.5" />
          </marker>
        </React.Fragment>
      ))}

      {/* ── Edge gradient definitions, one per layer ────────────────────────── */}
      {LAYER_IDS.map(id => (
        <linearGradient key={`edgegrad-${id}`} id={`edgegrad-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={LAYER_COLORS[id]} stopOpacity="0.3" />
          <stop offset="50%" stopColor={LAYER_COLORS[id]} stopOpacity="0.95" />
          <stop offset="100%" stopColor={LAYER_COLORS[id]} stopOpacity="0.6" />
        </linearGradient>
      ))}

      {/* ── Icon tile gradient fills (glyph family — shape only, not layer color) ── */}
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

      {/* ── Icon tile gradients recolored per-layer (used on canvas nodes) ─── */}
      {LAYER_IDS.map(id => (
        <linearGradient
          key={`tile-${id}`}
          id={`tile-${id}`}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientTransform="rotate(65 .5 .5)"
        >
          <stop offset="0%" stopColor={LAYER_COLORS[id]} stopOpacity="0.32" />
          <stop offset="100%" stopColor={LAYER_COLORS[id]} stopOpacity="0.14" />
        </linearGradient>
      ))}
      <linearGradient id="tile-neutral" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(65 .5 .5)">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
      </linearGradient>
    </defs>
  );
};
