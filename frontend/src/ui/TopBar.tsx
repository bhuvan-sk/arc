import React from 'react';

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
  ready: { label: 'Ready', color: '#46b980' },
  ingesting: { label: 'Ingesting…', color: '#e5ad3b' },
  parsing: { label: 'Parsing…', color: '#e5ad3b' },
  bucketing: { label: 'Bucketing…', color: '#e5ad3b' },
  narrating: { label: 'Narrating…', color: '#e5ad3b' },
  failed: { label: 'Failed', color: '#e05f5f' },
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
  const statusInfo = STATUS_LABELS[status] || { label: status, color: '#6a6a74' };

  return (
    <div
      style={{
        height: 48,
        background: '#111113',
        borderBottom: '1px solid #1d1d21',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Logo mark */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="9" height="9" rx="2" fill="#3b6fe5" />
        <rect x="13" y="2" width="9" height="9" rx="2" fill="#a273f2" opacity=".6" />
        <rect x="2" y="13" width="9" height="9" rx="2" fill="#46b980" opacity=".6" />
        <rect x="13" y="13" width="9" height="9" rx="2" fill="#e05fb0" opacity=".4" />
      </svg>

      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#e1e1e6', letterSpacing: '-0.1px' }}>
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <>
          <span style={{ color: '#2e2e36', fontSize: 16 }}>·</span>
          <span style={{ fontSize: 12, color: '#6a6a74' }}>{subtitle}</span>
        </>
      )}

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusInfo.color,
            boxShadow: status === 'ready' ? `0 0 5px ${statusInfo.color}` : 'none',
          }}
        />
        <span style={{ fontSize: 11, color: statusInfo.color }}>{statusInfo.label}</span>
      </div>

      {/* Upload button */}
      {onOpenUpload && (
        <button
          onClick={onOpenUpload}
          style={{
            background: 'linear-gradient(135deg, #3b6fe5, #5a4cd1)',
            border: 'none',
            borderRadius: 6,
            padding: '5px 12px',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginLeft: 8,
          }}
        >
          <span>↑</span> Upload PDF / Doc
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* View Mode Toggle */}
      <div
        style={{
          display: 'flex',
          gap: 1,
          background: '#0f0f11',
          border: '1px solid #2e2e36',
          borderRadius: 8,
          padding: 2,
        }}
      >
        {(['Document', 'Both', 'Canvas'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            style={{
              background: viewMode === mode ? '#26262c' : 'transparent',
              border: 'none',
              borderRadius: 6,
              padding: '4px 12px',
              color: viewMode === mode ? '#f2f2f4' : '#6a6a74',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Zoom control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#0f0f11',
          border: '1px solid #2e2e36',
          borderRadius: 8,
          padding: '4px 10px',
        }}
      >
        <button
          onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          style={{ background: 'none', border: 'none', color: '#82828c', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}
        >−</button>
        <span style={{ fontSize: 12, color: '#c8c8d1', minWidth: 36, textAlign: 'center' }}>
          {zoom}%
        </span>
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          style={{ background: 'none', border: 'none', color: '#82828c', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}
        >+</button>
      </div>

      {/* Export Controls */}
      {onExport && status === 'ready' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onExport('pdf')}
            style={{
              background: '#26262c',
              border: '1px solid #3a3a44',
              borderRadius: 6,
              padding: '4px 10px',
              color: '#d6d6dd',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Export PDF
          </button>
          <button
            onClick={() => onExport('docx')}
            style={{
              background: '#26262c',
              border: '1px solid #3a3a44',
              borderRadius: 6,
              padding: '4px 10px',
              color: '#d6d6dd',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Export DOCX
          </button>
        </div>
      )}

      {/* Session ID pill */}
      {sessionId && (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#3a3a44',
            padding: '3px 8px',
            background: '#0f0f11',
            border: '1px solid #1d1d21',
            borderRadius: 5,
          }}
        >
          {sessionId.slice(0, 16)}
        </div>
      )}
    </div>
  );
};
