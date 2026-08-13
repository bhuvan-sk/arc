import React from 'react';
import { COLORS } from '../theme/tokens';

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

export const StatusSplash: React.FC<StatusSplashProps> = ({ status, error, pollTimedOut, onCheckAgain }) => {
  const stages = ['ingesting', 'parsing', 'bucketing', 'narrating'];
  const currentStageIdx = stages.indexOf(status);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f11',
        gap: 24,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Animated logo */}
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ animation: 'fadeUp .4s ease' }}>
        <rect x="2" y="2" width="9" height="9" rx="2" fill="#3b6fe5" style={{ animation: 'popIn .3s ease .1s both' }} />
        <rect x="13" y="2" width="9" height="9" rx="2" fill="#a273f2" opacity=".8" style={{ animation: 'popIn .3s ease .2s both' }} />
        <rect x="2" y="13" width="9" height="9" rx="2" fill="#46b980" opacity=".8" style={{ animation: 'popIn .3s ease .3s both' }} />
        <rect x="13" y="13" width="9" height="9" rx="2" fill="#e05fb0" opacity=".5" style={{ animation: 'popIn .3s ease .4s both' }} />
      </svg>

      {error ? (
        <div style={{ color: '#e05f5f', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Pipeline failed</div>
          <div style={{ fontSize: 12, color: '#a9a9b3' }}>{error}</div>
        </div>
      ) : pollTimedOut ? (
        <div style={{ color: '#e1e1e6', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#c9a227' }}>Still working…</div>
          <div style={{ fontSize: 12, color: '#a9a9b3', marginBottom: 16 }}>
            This is taking longer than usual — large documents can take a few minutes.
            It hasn't failed; we just stopped watching. Check again to see if it's ready.
          </div>
          <button
            onClick={onCheckAgain}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #3b6fe5',
              background: 'transparent',
              color: '#3b6fe5',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Check again
          </button>
        </div>
      ) : (
        <>
          <div style={{ color: '#e1e1e6', fontSize: 15, fontWeight: 600 }}>
            {status === 'ingesting' && 'Reading your diagram…'}
            {status === 'parsing' && 'Extracting architecture graph…'}
            {status === 'bucketing' && 'Bucketing into layers…'}
            {status === 'narrating' && 'Generating layer narratives…'}
            {!stages.includes(status) && 'Processing…'}
          </div>

          {/* Stage progress dots */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {stages.map((stage, i) => {
              const isDone = i < currentStageIdx;
              const isCurrent = i === currentStageIdx;
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: isCurrent ? 10 : 7,
                      height: isCurrent ? 10 : 7,
                      borderRadius: '50%',
                      background: isDone ? '#46b980' : isCurrent ? COLORS.accent : '#2e2e36',
                      boxShadow: isCurrent ? `0 0 8px ${COLORS.accent}` : 'none',
                      transition: 'all .3s',
                    }}
                  />
                  {i < stages.length - 1 && (
                    <div
                      style={{
                        width: 24,
                        height: 1,
                        background: isDone ? '#46b980' : '#2e2e36',
                        transition: 'background .3s',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 12, color: '#3a3a44', fontFamily: "'JetBrains Mono', monospace" }}>
            {status}
          </div>
        </>
      )}
    </div>
  );
};
