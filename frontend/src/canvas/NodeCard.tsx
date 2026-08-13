import React from 'react';
import { TileSvg } from '../icons/TileSvg';
import { tint } from '../theme/tokens';
import { COLORS } from '../theme/tokens';

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
}

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
}) => {
  const color = COLORS.types[type] || COLORS.types.svc;
  const bgTint = tint(color);
  const isInferred = origin === 'inferred';

  return (
    <g
      transform={`translate(${x},${y})`}
      opacity={opacity}
      style={isAnimating ? { animation: 'nodeIn .45s cubic-bezier(.2,.8,.2,1) both' } : {}}
    >
      <rect
        x={0}
        y={0}
        width={220}
        height={62}
        rx={10}
        fill={bgTint}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={isInferred ? '4 3' : 'none'}
        filter="url(#nodeShadow)"
      />
      {/* 36x36 Raised gradient tile */}
      <TileSvg iconKey={iconKey} x={13} y={13} size={36} strokeWidth={2} />

      {/* Text area shifted to x=58 to accommodate larger 36x36 tile */}
      <foreignObject x={58} y={13} width={152} height={40}>
        <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#f2f2f4',
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
              fontSize: 12,
              color: '#82828c',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub}
          </div>
        </div>
      </foreignObject>

      {/* Optional "inferred" pill for Mode B / researched items */}
      {isInferred && (
        <foreignObject x={152} y={-9} width={60} height={18}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              fontWeight: 500,
              color: '#d6d6dd',
              background: '#161619',
              border: `1px solid ${color}`,
              borderRadius: 4,
              padding: '1px 5px',
              textAlign: 'center',
            }}
          >
            inferred
          </div>
        </foreignObject>
      )}
    </g>
  );
};
