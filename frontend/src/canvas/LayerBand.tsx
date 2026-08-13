import React from 'react';

interface LayerBandProps {
  x: number;
  y: number;
  label: string;
  opacity: number;
  isActive: boolean;
}

export const LayerBand: React.FC<LayerBandProps> = ({ x, y, label, opacity, isActive }) => {
  const color = isActive ? '#8b8b95' : '#5a5a63';

  return (
    <foreignObject x={x} y={y - 26} width={400} height={20} opacity={opacity}>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '1.6px',
          color,
        }}
      >
        {label}
      </div>
    </foreignObject>
  );
};
