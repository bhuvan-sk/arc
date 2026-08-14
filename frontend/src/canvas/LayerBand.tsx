import React from 'react';
import { FONT_MONO, COLORS } from '../theme/tokens';
import { VIEW_W } from '../lib/geometry';

interface LayerBandProps {
  x: number;
  y: number;
  label: string;
  opacity: number;
  isActive: boolean;
  color: string;
}

export const LayerBand: React.FC<LayerBandProps> = ({ y, label, opacity, isActive, color }) => {
  const textColor = isActive ? color : COLORS.textGhost;
  const zoneY = y - 78;
  const zoneHeight = 236;

  return (
    <g opacity={opacity}>
      <rect
        x={12}
        y={zoneY}
        width={VIEW_W - 24}
        height={zoneHeight}
        rx={20}
        fill={isActive ? `${color}09` : 'rgba(255,255,255,.022)'}
      />
      <text
        x={30}
        y={zoneY + 26}
        fontFamily={FONT_MONO}
        fontSize={8.5}
        letterSpacing="1"
        fill={textColor}
      >
        {label}
      </text>
    </g>
  );
};
