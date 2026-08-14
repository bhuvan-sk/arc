import React, { useState, useRef } from 'react';
import { COLORS, FONT_SANS, FONT_MONO } from '../theme/tokens';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], mode: 'A' | 'B', problemStatement?: string, title?: string) => void;
}

const kicker: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 8,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: COLORS.textFaint,
};

const fieldBox: React.CSSProperties = {
  width: '100%',
  borderRadius: 11,
  background: 'rgba(255,255,255,.06)',
  padding: '11px 12px',
  fontSize: 12.5,
  color: '#e6e9fb',
  border: 'none',
  outline: 'none',
  fontFamily: FONT_SANS,
};

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'A' | 'B'>('A');
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(5,6,13,.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_SANS,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 660,
          borderRadius: 20,
          background: 'linear-gradient(180deg,#171c34,#101426)',
          boxShadow: '0 50px 110px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1)',
          animation: 'lift .3s cubic-bezier(.2,.7,.2,1) both',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px' }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: '#eceffc' }}>New session</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,.07)', border: 0, borderRadius: 9, width: 28, height: 28, color: '#b6bcdd', fontSize: 15, cursor: 'pointer', fontFamily: FONT_SANS }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              borderRadius: 16,
              height: 140,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
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
            <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(146,166,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 17V5M7 10l5-5 5 5" stroke="#b3c0ff" strokeWidth={1.6} fill="none" strokeLinecap="round" />
                <path d="M4 20h16" stroke="rgba(179,192,255,.5)" strokeWidth={1.6} strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: 13.5, color: '#e6e9fb' }}>Drop a file, or <span style={{ color: '#b3c0ff' }}>browse</span></div>
            <div style={{ ...kicker, fontSize: 7.5 }}>pdf · png · jpg · docx · txt · md</div>
          </div>

          {selectedFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {selectedFiles.map((file, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,.05)' }}>
                  <span style={{ fontSize: 12, color: '#c2c8e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 460 }}>
                    {file.name} <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: COLORS.textGhost }}>({(file.size / 1024).toFixed(1)} KB)</span>
                  </span>
                  <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 0, color: COLORS.fail, cursor: 'pointer', fontSize: 13, fontFamily: FONT_SANS }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...kicker, marginBottom: 8 }}>Title</div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Optional" style={fieldBox} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...kicker, marginBottom: 8 }}>Mode</div>
              <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,.05)' }}>
                <button
                  type="button"
                  onClick={() => setMode('A')}
                  style={{
                    flex: 1, padding: 8, borderRadius: 9, fontSize: 12, textAlign: 'center', border: 0, cursor: 'pointer', fontFamily: FONT_SANS,
                    color: mode === 'A' ? '#0b0e1d' : '#b6bcdd',
                    background: mode === 'A' ? 'linear-gradient(140deg,#c8d1ff,#92a6ff)' : 'transparent',
                  }}
                >
                  A · Upload
                </button>
                <button
                  type="button"
                  onClick={() => setMode('B')}
                  style={{
                    flex: 1, padding: 8, borderRadius: 9, fontSize: 12, textAlign: 'center', border: 0, cursor: 'pointer', fontFamily: FONT_SANS,
                    color: mode === 'B' ? '#0b0e1d' : '#b6bcdd',
                    background: mode === 'B' ? 'linear-gradient(140deg,#c8d1ff,#92a6ff)' : 'transparent',
                  }}
                >
                  B · Research
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ ...kicker, marginBottom: 8 }}>Context</div>
            <textarea
              value={problemStatement}
              onChange={e => setProblemStatement(e.target.value)}
              placeholder="Optional problem statement"
              rows={2}
              style={{ ...fieldBox, resize: 'none', height: 54 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 22 }}>
            <button
              type="submit"
              disabled={selectedFiles.length === 0}
              style={{
                fontFamily: FONT_SANS,
                fontSize: 13.5,
                fontWeight: 500,
                color: '#0b0e1d',
                background: selectedFiles.length > 0 ? 'linear-gradient(140deg,#c8d1ff,#92a6ff)' : 'rgba(255,255,255,.08)',
                border: 0,
                borderRadius: 12,
                padding: '12px 21px',
                cursor: selectedFiles.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedFiles.length > 0 ? '0 12px 30px rgba(146,166,255,.35)' : 'none',
              }}
            >
              Parse &amp; generate
            </button>
            <span style={{ ...kicker }}>current session stays open</span>
          </div>
        </form>
      </div>
    </div>
  );
};
