import React from 'react';

export const GridBackground: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(#ffffff0d 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
  );
};
