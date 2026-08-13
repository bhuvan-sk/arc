import React from 'react';

interface SequenceBadgeProps {
  x: number;
  y: number;
  bx: number;
  by: number;
  n: number | string;
  color: string;
  opacity: number;
  isAnimating?: boolean;
}

export const SequenceBadge: React.FC<SequenceBadgeProps> = ({
  x,
  y,
  bx,
  by,
  n,
  color,
  opacity,
  isAnimating = false,
}) => {
  return (
    <g
      opacity={opacity}
      style={isAnimating ? { animation: 'popIn .3s ease .75s both' } : {}}
    >
      <circle cx={x} cy={y} r={10} fill={color} />
      <foreignObject x={bx} y={by} width={20} height={20}>
        <div
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: '#0f0f11',
          }}
        >
          {n}
        </div>
      </foreignObject>
    </g>
  );
};
