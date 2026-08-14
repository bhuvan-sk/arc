import React from 'react';
import { getIconByKey } from './families';

interface TileSvgProps {
  iconKey: string;
  x?: number;
  y?: number;
  size?: number; // default 36
  strokeWidth?: number; // default 2
  /** Layer-driven recolor — overrides the icon family's own palette so the
   * tile always reads as "this layer's color", not "this component type's
   * color" (Strata keys the whole canvas off layer identity). */
  tileGradientId?: string;
  glyphColor?: string;
  tileBorderColor?: string;
}

export const TileSvg: React.FC<TileSvgProps> = ({
  iconKey,
  x = 13,
  y = 13,
  size = 36,
  strokeWidth = 2,
  tileGradientId,
  glyphColor = '#f2f4ff',
  tileBorderColor,
}) => {
  const { icon, family } = getIconByKey(iconKey);
  const rx = Math.round(size * 0.26);
  const glyphSize = Math.round(size * (20 / 36));
  const glyphOffset = (size - glyphSize) / 2;
  const gradId = tileGradientId || `grad-${family.id}`;
  const borderColor = tileBorderColor || 'rgba(255,255,255,.14)';

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base tile with linear gradient fill */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        rx={rx}
        fill={`url(#${gradId})`}
        stroke={borderColor}
        strokeWidth={1}
      />
      {/* Top inner highlight line */}
      <line
        x1={rx}
        y1={1}
        x2={size - rx}
        y2={1}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={1}
      />
      {/* Icon glyph */}
      <g transform={`translate(${glyphOffset}, ${glyphOffset})`}>
        <svg
          width={glyphSize}
          height={glyphSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke={glyphColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={icon.d} />
        </svg>
      </g>
    </g>
  );
};
