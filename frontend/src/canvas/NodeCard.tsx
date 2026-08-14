import React from 'react';
import { TileSvg } from '../icons/TileSvg';
import { COLORS, FONT_SANS, FONT_MONO } from '../theme/tokens';

interface NodeCardProps {
  x: number;
  y: number;
  title: string;
  sub?: string | null;
  type: string; // db | svc | queue | infra | ext
  iconKey: string;
  opacity: number;
  origin?: 'stated' | 'inferred';
  isAnimating?: boolean;
  /** The color of the layer this node lives in (data/api/infra) — Strata
   * keys node color off layer, not component type. */
  layerColor: string;
}

const W = 220;
const H = 62;

export const NodeCard: React.FC<NodeCardProps> = ({
  x,
  y,
  title,
  sub = '',
  type,
  iconKey,
  opacity,
  origin = 'stated',
  isAnimating = false,
  layerColor,
}) => {
  const isExternal = type === 'ext';
  const isInferred = origin === 'inferred';
  const color = isExternal ? COLORS.extNeutral : layerColor;

  let fill: string;
  let stroke: string | undefined;
  let strokeDasharray: string | undefined;
  if (isExternal) {
    fill = '#141830';
    stroke = 'rgba(255,255,255,.08)';
  } else if (isInferred) {
    fill = 'rgba(20,25,48,.6)';
    stroke = layerColor;
    strokeDasharray = '3 5';
  } else {
    fill = 'url(#slab)';
    stroke = 'rgba(255,255,255,.06)';
  }

  const tileGradientId = isExternal ? 'tile-neutral' : `tile-${layerColorId(layerColor)}`;

  return (
    <g
      transform={`translate(${x},${y})`}
      opacity={opacity}
      style={isAnimating ? { animation: 'nodeIn .45s cubic-bezier(.2,.8,.2,1) both' } : {}}
    >
      {/* Soft glow beneath stated (non-inferred, non-external) nodes */}
      {!isExternal && !isInferred && (
        <ellipse cx={W / 2} cy={H + 6} rx={62} ry={7} fill={layerColor} opacity={0.22} filter="url(#softGlow)" />
      )}

      <rect
        x={0}
        y={0}
        width={W}
        height={H}
        rx={15}
        fill={fill}
        stroke={stroke}
        strokeWidth={isInferred ? 1 : 0.75}
        strokeOpacity={isInferred ? 0.55 : 1}
        strokeDasharray={strokeDasharray}
        filter="url(#nodeShadow)"
      />
      {/* Top inner highlight line */}
      <line x1={16} y1={0.8} x2={W - 16} y2={0.8} stroke="rgba(255,255,255,.14)" strokeWidth={1} />

      <TileSvg
        iconKey={iconKey}
        x={13}
        y={13}
        size={36}
        strokeWidth={1.5}
        tileGradientId={tileGradientId}
        glyphColor={isExternal ? '#c2c8e8' : '#f2f4ff'}
        tileBorderColor={isExternal ? 'rgba(255,255,255,.1)' : `${color}55`}
      />

      <foreignObject x={58} y={13} width={W - 58 - 10} height={40}>
        <div style={{ fontFamily: FONT_SANS, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#f2f4ff',
              letterSpacing: '-.1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 300,
              color: isExternal ? COLORS.textDim : color,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub}
          </div>
        </div>
      </foreignObject>

      {isInferred && (
        <foreignObject x={W - 66} y={7} width={58} height={16}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 7.5,
              letterSpacing: '.06em',
              color: '#07231c',
              background: layerColor,
              borderRadius: 6,
              padding: '2px 6px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            INFERRED
          </div>
        </foreignObject>
      )}
    </g>
  );
};

function layerColorId(hex: string): 'data' | 'api' | 'infra' {
  if (hex === COLORS.layers.data) return 'data';
  if (hex === COLORS.layers.api) return 'api';
  return 'infra';
}
