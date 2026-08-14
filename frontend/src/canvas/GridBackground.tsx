import React from 'react';

export const GridBackground: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,.075) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        opacity: 0.6,
        ...style,
      }}
    />
  );
};
