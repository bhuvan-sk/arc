import React from 'react';
import { getIconByKey } from './families';

interface TileSvgProps {
  iconKey: string;
  x?: number;
  y?: number;
  size?: number; // default 36
  strokeWidth?: number; // default 2
}

export const TileSvg: React.FC<TileSvgProps> = ({
  iconKey,
  x = 13,
  y = 13,
  size = 36,
  strokeWidth = 2,
}) => {
  const { icon, family } = getIconByKey(iconKey);
  const rx = Math.round(size * 0.26);
  const glyphSize = Math.round(size * (20 / 36));
  const glyphOffset = (size - glyphSize) / 2;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base tile with linear gradient fill */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        rx={rx}
        fill={`url(#grad-${family.id})`}
        stroke={family.dark}
        strokeWidth={1}
      />
      {/* Top inner highlight line */}
      <line
        x1={rx}
        y1={1}
        x2={size - rx}
        y2={1}
        stroke="rgba(255, 255, 255, 0.34)"
        strokeWidth={1}
      />
      {/* Bottom inner shadow line */}
      <line
        x1={rx}
        y1={size - 1}
        x2={size - rx}
        y2={size - 1}
        stroke="rgba(0, 0, 0, 0.34)"
        strokeWidth={1}
      />
      {/* Icon glyph */}
      <g transform={`translate(${glyphOffset}, ${glyphOffset})`}>
        <svg
          width={glyphSize}
          height={glyphSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}
        >
          <path d={icon.d} />
        </svg>
      </g>
    </g>
  );
};
