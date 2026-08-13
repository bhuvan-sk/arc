import React from 'react';

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
          borderRadius: 7,
          background: '#141417',
          border: `1px solid ${color}59`,
          color: '#c8c8d1',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </foreignObject>
  );
};
