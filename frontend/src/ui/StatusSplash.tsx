import React from 'react';
import { COLORS, FONT_SANS, FONT_MONO } from '../theme/tokens';

interface StatusSplashProps {
  status: string;
  error?: string | null;
  /** We stopped polling without a definitive ready/failed answer from the
   * backend — the job may still be running or may have already finished.
   * Rendered distinctly from `error`, which means the backend itself
   * reported failure. */
  pollTimedOut?: boolean;
  onCheckAgain?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  ingesting: 'Reading your diagram…',
  parsing: 'Extracting components…',
  bucketing: 'Bucketing into layers…',
  narrating: 'Generating layer narratives…',
};

const STAGES = [
  { key: 'ingesting', label: '01 ingest' },
  { key: 'parsing', label: '02 parse' },
  { key: 'bucketing', label: '03 bucket' },
  { key: 'narrating', label: '04 narrate' },
];

export const StatusSplash: React.FC<StatusSplashProps> = ({ status, error, pollTimedOut, onCheckAgain }) => {
  const currentStageIdx = STAGES.findIndex(s => s.key === status);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLORS.fieldGradient,
        fontFamily: FONT_SANS,
      }}
    >
      {/* Logo mark */}
      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 34 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, rgba(146,166,255,.4), transparent 62%)', filter: 'blur(16px)' }} />
        <div
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: 22,
            background: 'linear-gradient(150deg,#92a6ff,#4fd6b0)',
            boxShadow: '0 0 40px rgba(146,166,255,.5)',
            animation: 'spinslow 6s linear infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: 7, background: '#0a0d1a' }} />
        </div>
      </div>

      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 540 }}>
          <div style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-.022em', color: COLORS.fail, marginBottom: 14 }}>
            Pipeline failed
          </div>
          <div
            style={{
              borderRadius: 16,
              padding: '16px 20px',
              background: 'rgba(255,143,158,.12)',
              boxShadow: 'inset 0 0 0 1px rgba(255,143,158,.4), 0 0 50px rgba(255,143,158,.12)',
              textAlign: 'center',
              marginBottom: 40,
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.55, color: '#ffd0d6' }}>{error}</div>
          </div>
        </div>
      ) : pollTimedOut ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 540 }}>
          <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-.022em', color: '#e6e9fb', marginBottom: 14 }}>
            Still working…
          </div>
          <div style={{ borderRadius: 16, padding: '16px 20px', background: 'rgba(255,255,255,.05)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)', textAlign: 'center', marginBottom: 26 }}>
            <div style={{ fontSize: 14, lineHeight: 1.55, fontWeight: 300, color: COLORS.textSecondary }}>
              This is taking longer than usual — large documents can take a few minutes. It hasn't failed; we just stopped watching.
            </div>
          </div>
          <button
            onClick={onCheckAgain}
            style={{
              fontFamily: FONT_SANS,
              fontSize: 13,
              color: '#0b0e1d',
              background: '#b6bcdd',
              border: 0,
              borderRadius: 11,
              padding: '11px 19px',
              cursor: 'pointer',
              marginBottom: 40,
            }}
          >
            Check again
          </button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-.022em', color: '#f6f7ff', marginBottom: 12 }}>
            {STAGE_LABELS[status] || 'Processing…'}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: COLORS.textDim, marginBottom: 40 }}>
            stage {String(Math.max(currentStageIdx, 0) + 1).padStart(2, '0')} of 04
          </div>

          <div style={{ display: 'flex', gap: 8, width: 580 }}>
            {STAGES.map((stage, i) => {
              const isDone = i < currentStageIdx;
              const isCurrent = i === currentStageIdx;
              const color = isDone ? COLORS.layers.api : isCurrent ? COLORS.layers.data : 'rgba(255,255,255,.1)';
              return (
                <div key={stage.key} style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 3,
                      background: color,
                      boxShadow: isDone || isCurrent ? `0 0 12px ${color}` : 'none',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 8,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: isCurrent ? COLORS.textSecondary : isDone ? COLORS.layers.api : COLORS.textGhost,
                      paddingTop: 10,
                    }}
                  >
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
