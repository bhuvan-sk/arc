import React, { useState, useRef } from 'react';
import { COLORS } from '../theme/tokens';
import { SessionSummary } from '../api/types';

interface LandingScreenProps {
  onUpload: (files: File[], mode: 'A' | 'B', problemStatement?: string, title?: string) => void;
  onLoadDemo: () => void;
  sessionList: SessionSummary[];
  sessionListLoading: boolean;
  onSelectSession: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ready: '#46b980',
  failed: '#e05f5f',
  ingesting: '#c9a227',
  parsing: '#c9a227',
  bucketing: '#c9a227',
  narrating: '#c9a227',
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onUpload,
  onLoadDemo,
  sessionList,
  sessionListLoading,
  onSelectSession,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'A' | 'B'>('A');
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    onUpload(selectedFiles, mode, problemStatement || undefined, title || undefined);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f11',
        backgroundImage: 'radial-gradient(#ffffff0d 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        padding: 24,
        fontFamily: 'Inter, sans-serif',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1040,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          flex: '1 1 460px',
          background: '#161619',
          border: '1px solid #26262c',
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', gap: 6, marginBottom: 16 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="#3b6fe5" />
              <rect x="13" y="2" width="9" height="9" rx="2" fill="#a273f2" opacity=".8" />
              <rect x="2" y="13" width="9" height="9" rx="2" fill="#46b980" opacity=".8" />
              <rect x="13" y="13" width="9" height="9" rx="2" fill="#e05fb0" opacity=".5" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f2f2f4', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Architecture Explainer
          </h1>
          <p style={{ fontSize: 14, color: '#82828c', margin: 0, lineHeight: 1.6 }}>
            Upload any architecture diagram PDF, system design document, or image to parse components, generate multi-layer visual diagrams, and ask DDIA-grounded questions.
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? COLORS.accent : '#2e2e36'}`,
              borderRadius: 12,
              padding: '32px 20px',
              textAlign: 'center',
              background: isDragging ? '#1e2638' : '#111113',
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.docx,.txt,.md"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e1e1e6', marginBottom: 4 }}>
              Drop your architecture PDF / Spec file here
            </div>
            <div style={{ fontSize: 12, color: '#6a6a74' }}>
              Supports PDF, PNG, JPG, DOCX, TXT, Markdown
            </div>
          </div>

          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6a6a74', textTransform: 'uppercase' }}>
                Uploaded Files ({selectedFiles.length})
              </div>
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#0f0f11',
                    border: '1px solid #26262c',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#d6d6dd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 450 }}>
                    📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    style={{ background: 'none', border: 'none', color: '#e05f5f', cursor: 'pointer', fontSize: 14 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Title input */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#82828c', marginBottom: 6 }}>
              Architecture Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Payments Gateway Microservices"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0f0f11',
                border: '1px solid #2e2e36',
                borderRadius: 8,
                color: '#e1e1e6',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Context / Problem Statement */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#82828c', marginBottom: 6 }}>
              System Context / Problem Statement (Optional)
            </label>
            <textarea
              value={problemStatement}
              onChange={e => setProblemStatement(e.target.value)}
              placeholder="Describe scale targets, SLAs, or known architectural constraints…"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0f0f11',
                border: '1px solid #2e2e36',
                borderRadius: 8,
                color: '#e1e1e6',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#82828c', marginBottom: 6 }}>
              Analysis Mode
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setMode('A')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: mode === 'A' ? '#1e2a47' : '#0f0f11',
                  border: `1px solid ${mode === 'A' ? COLORS.accent : '#2e2e36'}`,
                  borderRadius: 8,
                  color: mode === 'A' ? '#f2f2f4' : '#82828c',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>Mode A: Upload Only</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: '#6a6a74', marginTop: 2 }}>
                  Extract strictly what is stated in your uploaded file
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('B')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: mode === 'B' ? '#2e1e47' : '#0f0f11',
                  border: `1px solid ${mode === 'B' ? '#a273f2' : '#2e2e36'}`,
                  borderRadius: 8,
                  color: mode === 'B' ? '#f2f2f4' : '#82828c',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>Mode B: Research Mode</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: '#6a6a74', marginTop: 2 }}>
                  Infer missing layers using public architectural best practice
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <button
              type="submit"
              disabled={selectedFiles.length === 0}
              style={{
                width: '100%',
                padding: '12px 0',
                background: selectedFiles.length > 0 ? 'linear-gradient(135deg, #3b6fe5, #5a4cd1)' : '#2e2e36',
                border: 'none',
                borderRadius: 9,
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: selectedFiles.length > 0 ? 'pointer' : 'default',
              }}
            >
              Parse Architecture & Generate Story →
            </button>

            <button
              type="button"
              onClick={onLoadDemo}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'transparent',
                border: '1px solid #2e2e36',
                borderRadius: 9,
                color: '#82828c',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Or load Payments Platform demo session
            </button>
          </div>
        </form>
      </div>

      {/* Recent Sessions */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          flex: '1 1 320px',
          background: '#161619',
          border: '1px solid #26262c',
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 640,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e1e1e6', marginBottom: 4, flexShrink: 0 }}>
          Recent Sessions
        </div>
        <div style={{ fontSize: 11, color: '#5f5f68', marginBottom: 12, flexShrink: 0 }}>
          Every parsed architecture is stored — pick one up where you left off.
        </div>

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sessionListLoading && sessionList.length === 0 && (
            <div style={{ fontSize: 12, color: '#5f5f68', padding: '12px 0' }}>Loading…</div>
          )}
          {!sessionListLoading && sessionList.length === 0 && (
            <div style={{ fontSize: 12, color: '#5f5f68', padding: '12px 0' }}>
              No sessions yet — upload an architecture to get started.
            </div>
          )}
          {sessionList.map(s => {
            const statusColor = STATUS_COLORS[s.status] || '#5f5f68';
            const isProcessing = !['ready', 'failed'].includes(s.status);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSession(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  background: '#111113',
                  border: '1px solid #26262c',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'border-color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#3a3a44')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#26262c')}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: statusColor,
                    marginTop: 5,
                    flexShrink: 0,
                    boxShadow: isProcessing ? `0 0 6px ${statusColor}` : 'none',
                    animation: isProcessing ? 'dotPulse 2.4s ease-in-out infinite' : 'none',
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#e1e1e6',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#6a6a74', marginTop: 2 }}>
                    {s.status}
                    {s.node_count > 0 && ` · ${s.node_count} components`}
                    {' · '}
                    {timeAgo(s.created_at)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
};
