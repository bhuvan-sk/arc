import React from 'react';
import { LayerData, LayerNarrative } from '../api/types';
import { COLORS, FONT_SANS, FONT_MONO, layerColorById } from '../theme/tokens';

interface LayerDocPanelProps {
  layer: LayerData | null;
  unlockedIndex: number;
  onNextLayer: () => void;
}

const kickerStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 8.5,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: COLORS.textGhost,
};

export const LayerDocPanel: React.FC<LayerDocPanelProps> = ({
  layer,
  unlockedIndex,
  onNextLayer,
}) => {
  if (!layer) {
    return (
      <div style={panelShell}>
        <div style={{ padding: 30, color: COLORS.textFaint, fontFamily: FONT_SANS, fontSize: 13 }}>
          No layer selected.
        </div>
      </div>
    );
  }

  const isLocked = layer.index > unlockedIndex;
  const accentColor = layerColorById(layer.id);
  const narrative: LayerNarrative | null = layer.narrative ?? null;
  const isInsufficient = layer.info_state === 'insufficient';
  const items = narrative?.items || [];
  const decisions = layer.scale_decisions || [];

  return (
    <div style={panelShell}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '30px 30px 8px' }}>
        <div style={{ animation: 'lift .45s cubic-bezier(.2,.7,.2,1) both' }}>
          {/* Kicker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
            <span
              style={{
                width: 30,
                height: 4,
                borderRadius: 3,
                background: isLocked ? '#3c4262' : accentColor,
                boxShadow: isLocked ? 'none' : `0 0 14px ${accentColor}90`,
              }}
            />
            <span style={{ ...kickerStyle, color: isLocked ? COLORS.textGhost : accentColor }}>
              {narrative?.kicker || layer.band_label}
            </span>
          </div>

          {isLocked ? (
            <LockedBody />
          ) : isInsufficient ? (
            <InsufficientBody
              text={narrative?.body || layer.insufficient_reason || 'No information available for this layer.'}
              nodeCount={items.length}
              decisionCount={decisions.length}
            />
          ) : (
            <NormalBody
              headline={narrative?.title || layer.name}
              body={narrative?.body || ''}
              items={items}
              decisions={decisions}
              accentColor={accentColor}
            />
          )}
        </div>
      </div>

      {/* Next Layer CTA */}
      {layer.index === unlockedIndex && !isLocked && (
        <div
          style={{
            flexShrink: 0,
            padding: '16px 24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'linear-gradient(180deg, rgba(146,166,255,0), rgba(146,166,255,.09))',
          }}
        >
          <button
            onClick={onNextLayer}
            style={{
              fontFamily: FONT_SANS,
              fontSize: 13.5,
              fontWeight: 500,
              color: '#0b0e1d',
              background: 'linear-gradient(140deg,#b3c0ff,#92a6ff)',
              border: 0,
              borderRadius: 11,
              padding: '12px 20px',
              cursor: 'pointer',
              boxShadow: '0 10px 26px rgba(146,166,255,.35)',
            }}
          >
            Next Layer
          </button>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.textGhost }}>⇧N</span>
        </div>
      )}
    </div>
  );
};

const panelShell: React.CSSProperties = {
  height: '100%',
  borderRadius: 18,
  background: 'linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.02))',
  boxShadow: '0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.09)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: FONT_SANS,
};

const NormalBody: React.FC<{
  headline: string;
  body: string;
  items: { node_id: string; title: string; sub: string }[];
  decisions: { rule_id: string; concern: string; decision: string; tradeoff_seed: string }[];
  accentColor: string;
}> = ({ headline, body, items, decisions, accentColor }) => (
  <>
    <h1
      style={{
        margin: '0 0 16px',
        fontSize: 31,
        lineHeight: 1.1,
        fontWeight: 300,
        letterSpacing: '-.024em',
        color: '#f6f7ff',
      }}
    >
      {headline}
    </h1>
    {body && (
      <p style={{ margin: '0 0 24px', fontSize: 14, lineHeight: 1.62, fontWeight: 300, color: COLORS.textSecondary }}>
        {body}
      </p>
    )}

    {items.length > 0 && (
      <>
        <div style={{ ...kickerStyle, marginBottom: 12 }}>
          Components — {String(items.length).padStart(2, '0')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 }}>
          {items.map(item => (
            <div
              key={item.node_id}
              style={{
                borderRadius: 13,
                padding: '14px 16px',
                background: accentColor + '12',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
                <span style={{ fontSize: 13.5, fontWeight: 500, color: '#f2f4ff' }}>{item.title}</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 300, color: COLORS.textMuted, paddingLeft: 16 }}>
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {decisions.length > 0 && (
      <>
        <div style={{ ...kickerStyle, marginBottom: 12 }}>Scale decisions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {decisions.map(dec => (
            <div key={dec.rule_id} style={{ borderRadius: 13, padding: 16, background: 'rgba(255,255,255,.035)' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: accentColor, marginBottom: 8 }}>
                {dec.concern}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: '#e6e9fb', marginBottom: 9 }}>{dec.decision}</div>
              {dec.tradeoff_seed && (
                <div style={{ display: 'flex', gap: 10, paddingTop: 10, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07)' }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '.06em', color: COLORS.cost, paddingTop: 3, flexShrink: 0 }}>
                    COST
                  </span>
                  <span style={{ fontSize: 12, lineHeight: 1.55, fontWeight: 300, color: COLORS.textMuted }}>
                    {dec.tradeoff_seed}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    )}
  </>
);

const InsufficientBody: React.FC<{ text: string; nodeCount: number; decisionCount: number }> = ({ text, nodeCount, decisionCount }) => (
  <>
    <h1 style={{ margin: '0 0 20px', fontSize: 31, lineHeight: 1.1, fontWeight: 300, letterSpacing: '-.024em', color: '#4b5178' }}>
      —
    </h1>
    <div style={{ borderRadius: 16, padding: 22, background: 'rgba(255,255,255,.05)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' }}>
      <div style={{ ...kickerStyle, color: '#b6bcdd', marginBottom: 13 }}>Not enough in the source</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.55, fontWeight: 300, color: '#e6e9fb' }}>{text}</div>
    </div>
    <div style={{ ...kickerStyle, marginTop: 18 }}>
      Found: {nodeCount} components / {decisionCount} decisions
    </div>
  </>
);

const LockedBody: React.FC = () => (
  <>
    <h1 style={{ margin: '0 0 24px', fontSize: 31, lineHeight: 1.2, fontWeight: 300, color: 'transparent' }}>
      <span style={{ display: 'block', width: '88%', height: 22, borderRadius: 11, background: 'rgba(255,255,255,.05)', marginBottom: 12 }} />
      <span style={{ display: 'block', width: '56%', height: 22, borderRadius: 11, background: 'rgba(255,255,255,.04)' }} />
    </h1>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, borderRadius: 16, padding: 22, background: 'rgba(255,255,255,.03)' }}>
      <svg width="15" height="18" viewBox="0 0 10 12" style={{ marginTop: 2, flexShrink: 0 }}>
        <rect x="1" y="5" width="8" height="6" rx="1.6" fill="none" stroke="#8f97bd" />
        <path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="#8f97bd" />
      </svg>
      <div>
        <div style={{ fontSize: 14.5, lineHeight: 1.5, color: '#b6bcdd', marginBottom: 7 }}>
          This layer is locked.
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, fontWeight: 300, color: COLORS.textDim }}>
          Advance from the layer you're on to unlock its narrative and analysis.
        </div>
      </div>
    </div>
  </>
);
