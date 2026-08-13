import React from 'react';
import { LayerData, LayerNarrative } from '../api/types';
import { COLORS } from '../theme/tokens';

interface LayerDocPanelProps {
  layer: LayerData | null;
  unlockedIndex: number;
  onNextLayer: () => void;
}

const LAYER_COLORS: Record<string, string> = {
  data: COLORS.types.db,
  api: COLORS.types.svc,
  infra: COLORS.types.infra,
};

export const LayerDocPanel: React.FC<LayerDocPanelProps> = ({
  layer,
  unlockedIndex,
  onNextLayer,
}) => {
  if (!layer) {
    return (
      <div style={{ padding: 32, color: '#6a6a74', fontFamily: 'Inter, sans-serif' }}>
        No layer selected.
      </div>
    );
  }

  const isLocked = layer.index > unlockedIndex;
  const accentColor = LAYER_COLORS[layer.id] || COLORS.accent;
  const narrative: LayerNarrative | null = layer.narrative ?? null;

  const isInsufficient = layer.info_state === 'insufficient';

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        overflowY: 'auto',
      }}
    >
      {/* Document header */}
      <div
        style={{
          padding: '28px 32px 0',
          borderBottom: '1px solid #1d1d21',
          paddingBottom: 24,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1.4px',
            color: '#6a6a74',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          {narrative?.kicker || layer.band_label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: '#f2f2f4',
            letterSpacing: '-0.5px',
            lineHeight: 1.15,
            marginBottom: 8,
          }}
        >
          {isLocked ? '━━━━━━━━' : (narrative?.title || layer.name)}
        </div>
        <div
          style={{
            width: 36,
            height: 3,
            borderRadius: 2,
            background: isLocked ? '#2e2e36' : accentColor,
          }}
        />
      </div>

      {/* Document body */}
      <div style={{ padding: '24px 32px', flex: 1 }}>
        {isLocked ? (
          <div
            style={{
              padding: 20,
              background: '#111113',
              border: '1px solid #26262c',
              borderRadius: 10,
              color: '#6a6a74',
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            🔒 This layer is locked. Advance to unlock its narrative and analysis.
          </div>
        ) : isInsufficient ? (
          <div
            style={{
              padding: 20,
              background: '#111113',
              border: '1px dashed #3a3a44',
              borderRadius: 10,
              color: '#a9a9b3',
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            {narrative?.body || layer.insufficient_reason || 'No information available for this layer.'}
          </div>
        ) : (
          <>
            {/* Body narrative */}
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.75,
                color: '#c8c8d1',
                margin: '0 0 24px',
              }}
            >
              {narrative?.body || ''}
            </p>

            {/* Component items list */}
            {(narrative?.items || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {(narrative?.items || []).map(item => (
                  <div
                    key={item.node_id}
                    style={{
                      padding: '12px 16px',
                      background: '#111113',
                      border: '1px solid #26262c',
                      borderRadius: 8,
                      borderLeft: `3px solid ${accentColor}`,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e1e1e6', marginBottom: 3 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#82828c', lineHeight: 1.5 }}>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Scale decisions */}
            {layer.scale_decisions?.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '1.2px',
                    color: '#5f5f68',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  Scale Decisions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {layer.scale_decisions.map(dec => (
                    <div
                      key={dec.rule_id}
                      style={{
                        padding: '10px 14px',
                        background: '#0f0f11',
                        border: '1px solid #26262c',
                        borderRadius: 7,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: accentColor,
                          letterSpacing: '0.8px',
                          textTransform: 'uppercase',
                          marginBottom: 4,
                        }}
                      >
                        {dec.concern}
                      </div>
                      <div style={{ fontSize: 13, color: '#d6d6dd', lineHeight: 1.5 }}>
                        {dec.decision}
                      </div>
                      <div style={{ fontSize: 11, color: '#5f5f68', marginTop: 4 }}>
                        Trade-off: {dec.tradeoff_seed}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Next Layer button at the bottom */}
      {layer.index === unlockedIndex && (
        <div style={{ padding: '16px 32px 24px', flexShrink: 0, borderTop: '1px solid #1d1d21' }}>
          <button
            onClick={onNextLayer}
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'linear-gradient(135deg, #3b6fe5, #5a4cd1)',
              border: 'none',
              borderRadius: 9,
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.2px',
              cursor: 'pointer',
              transition: 'opacity .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Next Layer ⇧N
          </button>
        </div>
      )}
    </div>
  );
};
