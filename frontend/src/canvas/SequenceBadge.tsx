import React from 'react';
import { FONT_MONO } from '../theme/tokens';

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
      <circle cx={x} cy={y} r={8} fill="#0b0e1d" stroke={color} strokeWidth={1} />
      <text
        x={x}
        y={y + 2.5}
        textAnchor="middle"
        fontFamily={FONT_MONO}
        fontSize={7.5}
        fill={color}
      >
        {n}
      </text>
    </g>
  );
};
