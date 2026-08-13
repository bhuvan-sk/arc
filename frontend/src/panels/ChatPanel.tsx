import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../api/types';
import { COLORS } from '../theme/tokens';
import { GeminiOrb } from '../canvas/GeminiOrb';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { useAppStore } from '../store/useAppStore';

interface ChatPanelProps {
  sessionId: string | undefined;
  messages: ChatMessage[];
  chatLoading: boolean;
  chatInput: string;
  onInputChange: (v: string) => void;
  onSend: (q: string) => void;
  onTraceClick?: (ids: string[]) => void;
  activeLayerIndex: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  sessionId,
  messages,
  chatLoading,
  chatInput,
  onInputChange,
  onSend,
  onTraceClick,
  activeLayerIndex,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const refreshChat = useAppStore((s) => s.refreshChat);
  const live = useGeminiLive(sessionId, refreshChat);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // While a live voice session is running, the orb reflects real Gemini state
  // (listening/thinking/speaking driven by actual audio events). Otherwise it
  // just reflects whether a text question is in flight.
  const orbState = live.isActive ? live.state : chatLoading ? 'thinking' : 'idle';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim()) {
        onSend(chatInput);
      }
    }
  };

  const layerColorMap: Record<number, string> = {
    0: COLORS.types.db,
    1: COLORS.types.svc,
    2: COLORS.types.infra,
  };
  const scopeColor = layerColorMap[activeLayerIndex] || COLORS.accent;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0b0b0d',
        borderLeft: '1px solid #1d1d21',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 3D Gemini Particle Orb Stage at top of panel */}
      <div style={{ padding: '12px 14px 0 14px', flexShrink: 0 }}>
        <GeminiOrb state={orbState} size={150} />
        {live.error && (
          <div style={{ marginTop: 8, fontSize: 10, color: '#c48055', textAlign: 'center', lineHeight: 1.5 }}>
            {live.error}
          </div>
        )}
      </div>

      {/* Header bar below Orb */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #1d1d21',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: scopeColor,
              boxShadow: `0 0 6px ${scopeColor}`,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#e1e1e6' }}>
            Architecture Chat
          </span>
          <span style={{ fontSize: 10, color: '#5f5f68' }}>
            Layer {activeLayerIndex + 1}
          </span>
        </div>

        {/* Gemini Live voice toggle */}
        <button
          onClick={live.toggle}
          disabled={!sessionId}
          title={sessionId ? undefined : 'Load a session first'}
          style={{
            background: live.isActive ? '#3b1f1f' : 'rgba(255,255,255,.06)',
            border: `1px solid ${live.isActive ? '#5c2e2e' : 'rgba(255,255,255,.12)'}`,
            borderRadius: 14,
            padding: '3px 9px',
            color: live.isActive ? '#f0a789' : '#f5f5f7',
            fontSize: 10,
            fontFamily: 'ui-monospace, Menlo, monospace',
            cursor: sessionId ? 'pointer' : 'default',
            opacity: sessionId ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{live.isActive ? '⏹' : '🎙'}</span> {live.isActive ? 'Stop Voice' : 'Voice Query'}
        </button>
      </div>

      {/* Message List Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#4a4a53', fontSize: 12, paddingTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
            Ask anything about the architecture via voice or text
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            scopeColor={scopeColor}
            onTraceClick={onTraceClick}
          />
        ))}

        {chatLoading && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingLeft: 4 }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: '50%', background: '#a273f2',
                  animation: `fadeUp .6s ease ${i * 0.15}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Text Chat Input Box */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #1d1d21', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: '#111113',
            border: '1px solid #2e2e36',
            borderRadius: 10,
            padding: '8px 12px',
            alignItems: 'flex-end',
          }}
        >
          <textarea
            value={chatInput}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this layer…"
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e1e1e6',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              resize: 'none',
              lineHeight: 1.5,
              maxHeight: 100,
              overflowY: 'auto',
            }}
          />
          <button
            onClick={() => {
              if (chatInput.trim()) {
                onSend(chatInput);
              }
            }}
            disabled={!chatInput.trim() || chatLoading}
            style={{
              background: chatInput.trim() ? COLORS.accent : '#2e2e36',
              border: 'none',
              borderRadius: 6,
              padding: '5px 9px',
              cursor: chatInput.trim() ? 'pointer' : 'default',
              color: '#fff',
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  msg: ChatMessage;
  scopeColor: string;
  onTraceClick?: (ids: string[]) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, scopeColor, onTraceClick }) => {
  const isUser = msg.role === 'user';
  const isBlocked = msg.blocked;

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '85%',
            background: '#1e2a47',
            border: '1px solid #2d3f6e',
            borderRadius: '10px 10px 2px 10px',
            padding: '8px 12px',
            fontSize: 12,
            color: '#d6d6dd',
            lineHeight: 1.5,
          }}
        >
          {msg.text}
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div
          style={{
            maxWidth: '90%',
            background: '#1a1413',
            border: '1px solid #3d2c22',
            borderRadius: '2px 10px 10px 10px',
            padding: '8px 12px',
            fontSize: 12,
            color: '#c48055',
            lineHeight: 1.5,
          }}
        >
          🔒 {msg.block?.hint || msg.text}
        </div>
      </div>
    );
  }

  const claims = msg.claims || [];
  const hasClaims = claims.length > 1;

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: '90%' }}>
        <div
          style={{
            background: '#161619',
            border: '1px solid #26262c',
            borderRadius: '2px 10px 10px 10px',
            padding: '10px 14px',
            fontSize: 12,
            color: '#d6d6dd',
            lineHeight: 1.6,
          }}
        >
          {hasClaims ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {claims.map((claim, i) => (
                <div key={i}>
                  <div style={{ color: '#e1e1e6' }}>{claim.text}</div>
                  {claim.tradeoff && (
                    <div style={{ fontSize: 10, color: '#6a6a74', marginTop: 3, borderLeft: '2px solid #3b6fe5', paddingLeft: 6 }}>
                      ↔ {claim.tradeoff}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>{claims[0]?.text || msg.text}</div>
          )}
        </div>

        {(msg.trace_path || []).length > 0 && onTraceClick && (
          <button
            onClick={() => onTraceClick!(msg.trace_path!)}
            style={{
              marginTop: 5,
              fontSize: 10,
              color: scopeColor,
              background: 'transparent',
              border: `1px solid ${scopeColor}40`,
              borderRadius: 5,
              padding: '2px 8px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ✦ Highlight path on diagram
          </button>
        )}
      </div>
    </div>
  );
};
