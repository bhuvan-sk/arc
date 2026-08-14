import React from 'react';
import { FONT_MONO } from '../theme/tokens';

interface MetricPillProps {
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
}

export const MetricPill: React.FC<MetricPillProps> = ({ x, y, text, color, opacity }) => {
  return (
    <foreignObject x={x - 45} y={y - 12} width={90} height={24} opacity={opacity}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '2px 8px',
          borderRadius: 8,
          background: `${color}1f`,
          color,
          fontFamily: FONT_MONO,
          fontSize: 9.5,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </foreignObject>
  );
};
