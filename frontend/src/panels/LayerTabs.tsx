import React from 'react';
import { COLORS } from '../theme/tokens';

interface LayerTabsProps {
  layers: { index: number; name: string; id: string }[];
  activeIndex: number;
  unlockedIndex: number;
  onActivate: (i: number) => void;
}

const LAYER_COLORS: Record<string, string> = {
  data: COLORS.types.db,
  api: COLORS.types.svc,
  infra: COLORS.types.infra,
};

export const LayerTabs: React.FC<LayerTabsProps> = ({
  layers,
  activeIndex,
  unlockedIndex,
  onActivate,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: '0 20px',
        background: '#111113',
        borderBottom: '1px solid #1d1d21',
        height: 40,
        alignItems: 'stretch',
      }}
    >
      {layers.map((layer) => {
        const isActive = layer.index === activeIndex;
        const isLocked = layer.index > unlockedIndex;
        const color = LAYER_COLORS[layer.id] || COLORS.accent;

        return (
          <button
            key={layer.index}
            onClick={() => !isLocked && onActivate(layer.index)}
            disabled={isLocked}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
              padding: '0 14px',
              color: isActive ? '#f2f2f4' : isLocked ? '#3a3a44' : '#82828c',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: isLocked ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color .15s',
            }}
          >
            {isLocked && <span style={{ fontSize: 10 }}>🔒</span>}
            {layer.name}
          </button>
        );
      })}
    </div>
  );
};
