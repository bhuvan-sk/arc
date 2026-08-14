import React, { useState, useRef } from 'react';
import { COLORS, FONT_SANS, FONT_MONO } from '../theme/tokens';
import { SessionSummary } from '../api/types';

interface LandingScreenProps {
  onUpload: (files: File[], mode: 'A' | 'B', problemStatement?: string, title?: string) => void;
  onLoadDemo: () => void;
  sessionList: SessionSummary[];
  sessionListLoading: boolean;
  onSelectSession: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ready: COLORS.layers.api,
  failed: COLORS.fail,
  ingesting: COLORS.layers.infra,
  parsing: COLORS.layers.infra,
  bucketing: COLORS.layers.infra,
  narrating: COLORS.layers.infra,
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

const kicker: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 8,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: COLORS.textFaint,
};

const fieldBox: React.CSSProperties = {
  borderRadius: 12,
  background: 'rgba(255,255,255,.05)',
  padding: '12px 13px',
  fontSize: 13,
  color: '#e6e9fb',
  border: 'none',
  outline: 'none',
  fontFamily: FONT_SANS,
  width: '100%',
};

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
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== idx));

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
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'auto',
        padding: '74px 24px',
        fontFamily: FONT_SANS,
        background: COLORS.fieldGradient,
      }}
    >
      <div style={{ width: '100%', maxWidth: 1140, display: 'flex', flexWrap: 'wrap', gap: 60 }}>
        {/* Left: form */}
        <div style={{ width: '100%', maxWidth: 640, flex: '1 1 460px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 28 }}>
            <div style={{ width: 30, height: 30, borderRadius: 11, background: 'linear-gradient(150deg,#92a6ff,#4fd6b0)', boxShadow: '0 0 26px rgba(146,166,255,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 9, height: 9, borderRadius: 4, background: '#0b0e1d' }} />
            </div>
            <span style={{ fontSize: 17.5, fontWeight: 500, letterSpacing: '-.01em', color: '#eceffc' }}>Architecture Explainer</span>
          </div>

          <h1 style={{ margin: '0 0 16px', fontSize: 44, lineHeight: 1.05, fontWeight: 300, letterSpacing: '-.03em', color: '#f6f7ff' }}>
            Read a system the way it was built — one layer at a time.
          </h1>
          <p style={{ margin: '0 0 34px', fontSize: 15.5, lineHeight: 1.6, fontWeight: 300, color: COLORS.textMuted, maxWidth: 530 }}>
            Drop in a diagram or a design doc. We parse it into a graph, then unlock Data, API and Infra in order — each with a written narrative and the tradeoff behind every decision.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                borderRadius: 18,
                height: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                cursor: 'pointer',
                background: isDragging
                  ? 'radial-gradient(80% 100% at 50% 0%, rgba(146,166,255,.28), rgba(255,255,255,.04))'
                  : 'radial-gradient(80% 100% at 50% 0%, rgba(146,166,255,.16), rgba(255,255,255,.03))',
                boxShadow: `inset 0 0 0 1px ${isDragging ? 'rgba(146,166,255,.65)' : 'rgba(146,166,255,.28)'}`,
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
              <div style={{ width: 46, height: 46, borderRadius: 16, background: 'rgba(146,166,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path d="M12 17V5M7 10l5-5 5 5" stroke="#b3c0ff" strokeWidth={1.6} fill="none" strokeLinecap="round" />
                  <path d="M4 20h16" stroke="rgba(179,192,255,.5)" strokeWidth={1.6} strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontSize: 14.5, color: '#e6e9fb' }}>Drop a file, or <span style={{ color: '#b3c0ff' }}>browse</span></div>
              <div style={{ ...kicker }}>pdf · png · jpg · docx · txt · md</div>
            </div>

            {selectedFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                {selectedFiles.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 13px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,.05)',
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: '#c2c8e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 460 }}>
                      {file.name} <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.textGhost }}>({(file.size / 1024).toFixed(1)} KB)</span>
                    </span>
                    <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 0, color: COLORS.fail, cursor: 'pointer', fontSize: 14, fontFamily: FONT_SANS }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ ...kicker, marginBottom: 8 }}>Title — optional</div>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Checkout & ledger" style={fieldBox} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...kicker, marginBottom: 8 }}>Context — optional</div>
                <input value={problemStatement} onChange={e => setProblemStatement(e.target.value)} placeholder="What are you deciding?" style={fieldBox} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setMode('A')}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  borderRadius: 14,
                  padding: 15,
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: FONT_SANS,
                  background: mode === 'A' ? 'rgba(146,166,255,.12)' : 'rgba(255,255,255,.04)',
                  boxShadow: mode === 'A' ? 'inset 0 0 0 1px rgba(146,166,255,.45)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: mode === 'A' ? COLORS.layers.data : 'transparent', boxShadow: mode === 'A' ? `0 0 10px ${COLORS.layers.data}` : 'inset 0 0 0 1.5px #7b83aa' }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: mode === 'A' ? '#f6f7ff' : '#dfe3fb' }}>Mode A — Upload only</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 300, color: mode === 'A' ? '#b6bcdd' : '#8f97bd' }}>
                  Strictly what the file says. Gaps stay gaps.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('B')}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  borderRadius: 14,
                  padding: 15,
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: FONT_SANS,
                  background: mode === 'B' ? 'rgba(146,166,255,.12)' : 'rgba(255,255,255,.04)',
                  boxShadow: mode === 'B' ? 'inset 0 0 0 1px rgba(146,166,255,.45)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: mode === 'B' ? COLORS.layers.data : 'transparent', boxShadow: mode === 'B' ? `0 0 10px ${COLORS.layers.data}` : 'inset 0 0 0 1.5px #7b83aa' }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: mode === 'B' ? '#f6f7ff' : '#dfe3fb' }}>Mode B — Research</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 300, color: mode === 'B' ? '#b6bcdd' : '#8f97bd' }}>
                  Fill gaps from public best practice. Inferred nodes are marked.
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 26 }}>
              <button
                type="submit"
                disabled={selectedFiles.length === 0}
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: '#0b0e1d',
                  background: selectedFiles.length > 0 ? 'linear-gradient(140deg,#c8d1ff,#92a6ff)' : 'rgba(255,255,255,.08)',
                  border: 0,
                  borderRadius: 13,
                  padding: '14px 24px',
                  cursor: selectedFiles.length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: selectedFiles.length > 0 ? '0 14px 34px rgba(146,166,255,.35)' : 'none',
                }}
              >
                Parse &amp; generate
              </button>
              <a href="#" onClick={(e) => { e.preventDefault(); onLoadDemo(); }} style={{ fontSize: 13 }}>
                Load demo session →
              </a>
            </div>
          </form>
        </div>

        {/* Right: recent sessions */}
        <div style={{ width: '100%', maxWidth: 420, flex: '1 1 320px' }}>
          <div style={{ ...kicker, marginBottom: 14 }}>Recent sessions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {sessionListLoading && sessionList.length === 0 && (
              <div style={{ fontSize: 12, color: COLORS.textGhost, padding: '12px 0' }}>Loading…</div>
            )}
            {!sessionListLoading && sessionList.length === 0 && (
              <div style={{ fontSize: 12, color: COLORS.textGhost, padding: '12px 0' }}>
                No sessions yet — upload an architecture to get started.
              </div>
            )}
            {sessionList.map(s => {
              const statusColor = STATUS_COLORS[s.status] || COLORS.textGhost;
              const isProcessing = !['ready', 'failed'].includes(s.status);
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 13,
                    borderRadius: 14,
                    padding: '15px 16px',
                    background: 'rgba(255,255,255,.05)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: statusColor,
                      boxShadow: `0 0 10px ${statusColor}`,
                      flexShrink: 0,
                      animation: isProcessing ? 'breathe 1.8s ease-in-out infinite' : 'none',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: '#f2f4ff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: COLORS.textFaint }}>
                      {s.status === 'ready' && s.node_count > 0 ? `${s.node_count} components` : s.status === 'failed' ? 'failed' : `${s.status}…`}
                    </div>
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: COLORS.textFaint }}>{timeAgo(s.created_at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
