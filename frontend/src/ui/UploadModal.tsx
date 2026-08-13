import React, { useState, useRef } from 'react';
import { COLORS } from '../theme/tokens';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], mode: 'A' | 'B', problemStatement?: string, title?: string) => void;
}

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
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 520,
          background: '#161619',
          border: '1px solid #26262c',
          borderRadius: 14,
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #26262c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f2f2f4' }}>
              Upload Architecture Document
            </div>
            <div style={{ fontSize: 12, color: '#82828c', marginTop: 2 }}>
              Upload PDF diagrams, technical specs, or images to analyze
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#82828c',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? COLORS.accent : '#2e2e36'}`,
              borderRadius: 10,
              padding: '28px 20px',
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
            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e1e1e6', marginBottom: 4 }}>
              Click or drag PDF diagram / architecture doc here
            </div>
            <div style={{ fontSize: 12, color: '#6a6a74' }}>
              Supports PDF, PNG, JPG, DOCX, TXT, Markdown
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6a6a74', textTransform: 'uppercase' }}>
                Selected Files ({selectedFiles.length})
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
                  <span style={{ color: '#d6d6dd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 380 }}>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
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

          {/* Optional Title */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#82828c', marginBottom: 6 }}>
              Architecture Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Order Processing Engine"
              style={{
                width: '100%',
                padding: '9px 12px',
                background: '#0f0f11',
                border: '1px solid #2e2e36',
                borderRadius: 7,
                color: '#e1e1e6',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Optional Problem Statement */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#82828c', marginBottom: 6 }}>
              Context / Problem Statement (Optional)
            </label>
            <textarea
              value={problemStatement}
              onChange={e => setProblemStatement(e.target.value)}
              placeholder="Describe scale targets, SLAs, or known architectural bottlenecks…"
              rows={2}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: '#0f0f11',
                border: '1px solid #2e2e36',
                borderRadius: 7,
                color: '#e1e1e6',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Analysis Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#82828c', marginBottom: 6 }}>
              Analysis Mode
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setMode('A')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
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
                  Extract solely what is explicitly stated in your file
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('B')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
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
                  Fill empty layers from public architectural best practices
                </div>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                background: 'transparent',
                border: '1px solid #2e2e36',
                borderRadius: 7,
                color: '#82828c',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedFiles.length === 0}
              style={{
                padding: '9px 20px',
                background: selectedFiles.length > 0 ? COLORS.accent : '#2e2e36',
                border: 'none',
                borderRadius: 7,
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: selectedFiles.length > 0 ? 'pointer' : 'default',
              }}
            >
              Upload & Generate Architecture
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
