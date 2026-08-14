import React from 'react';
import { COLORS, FONT_SANS, FONT_MONO, layerColorById } from '../theme/tokens';

interface LayerTabsProps {
  layers: { index: number; name: string; id: string }[];
  activeIndex: number;
  unlockedIndex: number;
  onActivate: (i: number) => void;
}

const LockIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="10" height="12" viewBox="0 0 10 12">
    <rect x="1" y="5" width="8" height="6" rx="1.6" fill="none" stroke={color} />
    <path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke={color} />
  </svg>
);

export const LayerTabs: React.FC<LayerTabsProps> = ({
  layers,
  activeIndex,
  unlockedIndex,
  onActivate,
}) => {
  return (
    <div
      style={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'stretch',
        gap: 6,
        padding: '0 20px',
        background: 'rgba(8,10,20,.45)',
      }}
    >
      {layers.map((layer) => {
        const isActive = layer.index === activeIndex;
        const isLocked = layer.index > unlockedIndex;
        const color = layerColorById(layer.id);

        return (
          <button
            key={layer.index}
            onClick={() => !isLocked && onActivate(layer.index)}
            disabled={isLocked}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 18px',
              background: isActive ? color + '1f' : 'transparent',
              border: 0,
              borderRadius: '12px 12px 0 0',
              boxShadow: isActive ? `inset 0 -2px 0 ${color}` : 'inset 0 -2px 0 transparent',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              fontFamily: FONT_SANS,
              filter: isLocked ? 'saturate(.3)' : 'none',
              transition: 'background .15s, box-shadow .15s',
            }}
          >
            <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, color: isLocked ? '#3c4262' : COLORS.textGhost }}>
              {String(layer.index + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: isLocked ? '#565d80' : isActive ? '#f2f4ff' : '#b6bcdd' }}>
              {layer.name}
            </span>
            {isLocked ? (
              <LockIcon color="#565d80" />
            ) : (
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
            )}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Unlock progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing: '.04em', textTransform: 'uppercase', color: COLORS.textGhost }}>
        <span style={{ display: 'flex', gap: 3 }}>
          {layers.map(layer => (
            <span
              key={layer.index}
              style={{
                width: 14,
                height: 3,
                borderRadius: 2,
                background: layer.index <= unlockedIndex ? layerColorById(layer.id) : 'rgba(255,255,255,.12)',
              }}
            />
          ))}
        </span>
        {Math.min(unlockedIndex + 1, layers.length)} of {layers.length} unlocked
      </div>
    </div>
  );
};
