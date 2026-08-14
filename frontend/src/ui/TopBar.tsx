import React from 'react';
import { COLORS, FONT_SANS, FONT_MONO } from '../theme/tokens';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  status?: string;
  sessionId?: string;
  zoom: number;
  onZoomChange: (z: number) => void;
  viewMode: 'Document' | 'Both' | 'Canvas';
  onViewModeChange: (m: 'Document' | 'Both' | 'Canvas') => void;
  onExport?: (format: 'pdf' | 'docx') => void;
  onOpenUpload?: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ready: { label: 'Ready', color: COLORS.layers.api },
  ingesting: { label: 'Ingesting…', color: COLORS.layers.infra },
  parsing: { label: 'Parsing…', color: COLORS.layers.infra },
  bucketing: { label: 'Bucketing…', color: COLORS.layers.infra },
  narrating: { label: 'Narrating…', color: COLORS.layers.infra },
  failed: { label: 'Failed', color: COLORS.fail },
};

const ghostBtn: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: 12,
  color: '#dfe3fb',
  background: 'rgba(255,255,255,.06)',
  border: 0,
  borderRadius: 9,
  padding: '7px 13px',
  cursor: 'pointer',
};

export const TopBar: React.FC<TopBarProps> = ({
  title = 'Architecture Explainer',
  subtitle,
  status = 'ready',
  sessionId,
  zoom,
  onZoomChange,
  viewMode,
  onViewModeChange,
  onExport,
  onOpenUpload,
}) => {
  const statusInfo = STATUS_LABELS[status] || { label: status, color: COLORS.textFaint };

  const viewModes: Array<'Document' | 'Both' | 'Canvas'> = ['Document', 'Both', 'Canvas'];

  return (
    <div
      style={{
        height: 48,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 20px',
        background: 'rgba(8,10,20,.72)',
        boxShadow: '0 1px 0 rgba(255,255,255,.05), 0 12px 30px rgba(0,0,0,.35)',
        userSelect: 'none',
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: 8,
          background: 'linear-gradient(150deg,#92a6ff,#4fd6b0)',
          boxShadow: '0 0 18px rgba(146,166,255,.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: 3, background: '#0b0e1d' }} />
      </div>

      {/* Title + subtitle */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: '-.005em', color: '#eceffc' }}>{title}</span>
        {subtitle && (
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.textFaint, letterSpacing: '.02em' }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px 4px 8px',
          borderRadius: 20,
          background: statusInfo.color + '1a',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusInfo.color,
            boxShadow: `0 0 10px ${statusInfo.color}`,
          }}
        />
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 8.5,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: statusInfo.color,
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Upload button */}
      {onOpenUpload && (
        <button onClick={onOpenUpload} style={ghostBtn}>
          Upload PDF / Doc
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* View Mode Toggle */}
      <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 11, background: 'rgba(255,255,255,.05)' }}>
        {viewModes.map(mode => {
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              style={{
                fontFamily: FONT_SANS,
                fontSize: 11.5,
                padding: '5px 11px',
                border: 0,
                borderRadius: 8,
                cursor: 'pointer',
                background: active ? 'rgba(146,166,255,.22)' : 'transparent',
                color: active ? '#f2f4ff' : '#8f97bd',
              }}
            >
              {mode}
            </button>
          );
        })}
      </div>

      {/* Zoom control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 8px',
          borderRadius: 10,
          background: 'rgba(255,255,255,.05)',
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: '#b6bcdd',
        }}
      >
        <span
          style={{ cursor: 'pointer', color: '#8f97bd' }}
          onClick={() => onZoomChange(Math.max(50, zoom - 10))}
        >
          −
        </span>
        <span style={{ width: 34, textAlign: 'center' }}>{zoom}%</span>
        <span
          style={{ cursor: 'pointer', color: '#8f97bd' }}
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
        >
          +
        </span>
      </div>

      {/* Export Controls */}
      {onExport && status === 'ready' && (
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => onExport('pdf')} style={ghostBtn}>Export PDF</button>
          <button onClick={() => onExport('docx')} style={ghostBtn}>Export DOCX</button>
        </div>
      )}

      {/* Session ID chip */}
      {sessionId && (
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.textGhost }}>
          {sessionId.slice(0, 16)}
        </span>
      )}
    </div>
  );
};
