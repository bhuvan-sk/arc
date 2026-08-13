import React, { useRef } from 'react';
import { computeEdgeStyle } from '../lib/edgeStyle';

interface EdgePathProps {
  d: string;
  color: string;
  nodeType: string;         // 'db' | 'svc' | 'queue' | 'infra' | 'ext'
  transport: string;
  opacity: number;
  isTraced?: boolean;
  isRevealing?: boolean;
  isBidirectional?: boolean;
  label?: string | null;
  /** Where to center the label pill. Passed in (rather than measured off the
   * path here) so it can be kept in sync with the sequence badge's position —
   * both come from the same computeStepMarker() call in Canvas.tsx. */
  labelPos?: { x: number; y: number } | null;
}

export const EdgePath: React.FC<EdgePathProps> = ({
  d,
  color,
  nodeType,
  transport,
  opacity,
  isTraced = false,
  isRevealing = false,
  isBidirectional = false,
  label,
  labelPos,
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const styleConfig = computeEdgeStyle(transport, isTraced);

  const markerId = isTraced ? `ar-${nodeType}-traced` : `ar-${nodeType}`;
  const markerEnd = `url(#${markerId})`;
  const markerStart = isBidirectional ? `url(#ar-${nodeType}-start)` : undefined;

  // Draw-in animation on reveal using pathLength trick
  const drawIn = isRevealing;

  // Use gradient stroke for active layer; solid for dimmed
  const strokePaint = isTraced
    ? color
    : `url(#edgegrad-${nodeType})`;

  const glowFilter = isTraced ? `url(#glow-${nodeType})` : undefined;

  return (
    <g>
      {/* Shadow/halo track under the real line for depth */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={styleConfig.strokeWidth + 4}
        strokeLinecap="round"
        opacity={opacity * 0.08}
      />

      {/* Main edge */}
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={strokePaint}
        strokeWidth={styleConfig.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * styleConfig.opacity}
        markerEnd={markerEnd}
        markerStart={markerStart}
        pathLength={drawIn ? 1 : undefined}
        strokeDasharray={drawIn ? '1' : styleConfig.strokeDasharray}
        filter={glowFilter}
        style={{
          transition: 'opacity .3s ease',
          animation: drawIn
            ? 'drawIn .55s ease .32s both'
            : styleConfig.flowAnimation
            ? 'dash 1.8s linear infinite'
            : 'none',
        }}
      />

      {/* Edge label: what's actually flowing on this connection (e.g. "write
          order", "settlement") — not the transport type. Positioned above the
          sequence badge, never on top of it. */}
      {label && labelPos && (
        <EdgeLabel x={labelPos.x} y={labelPos.y} label={label} color={color} opacity={opacity} />
      )}
    </g>
  );
};

/** A compact pill floating above the connector, offset clear of the sequence badge. */
const EdgeLabel: React.FC<{ x: number; y: number; label: string; color: string; opacity: number }> = ({
  x,
  y,
  label,
  color,
  opacity,
}) => {
  const width = Math.min(190, Math.max(56, label.length * 6.2 + 18));
  return (
    <foreignObject x={x - width / 2} y={y - 10} width={width} height={18} opacity={opacity} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '0 7px',
          borderRadius: 6,
          background: '#111113',
          border: `1px solid ${color}4d`,
          color,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9.5,
          letterSpacing: '.03em',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </foreignObject>
  );
};
