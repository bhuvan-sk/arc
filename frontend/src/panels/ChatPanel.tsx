import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../api/types';
import { COLORS, FONT_SANS, FONT_MONO, layerColorByIndex } from '../theme/tokens';
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

const LAYER_NAMES: Record<number, string> = { 0: 'Data', 1: 'API', 2: 'Infra' };

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

  const scopeColor = layerColorByIndex(activeLayerIndex);
  const scopeName = `Scoped to layer 0${activeLayerIndex + 1} · ${LAYER_NAMES[activeLayerIndex] || ''}`;

  const canSend = chatInput.trim() && !live.isActive;

  return (
    <div
      style={{
        height: '100%',
        borderRadius: 18,
        background: 'linear-gradient(180deg, rgba(13, 16, 35, 0.85), rgba(6, 8, 18, 0.9))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.09)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: FONT_SANS,
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, height: 50, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: scopeColor, boxShadow: `0 0 10px ${scopeColor}` }} />
        <span style={{ fontSize: 12.5, color: '#dfe3fb' }}>{scopeName}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={live.toggle}
          disabled={!sessionId}
          title={sessionId ? undefined : 'Load a session first'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: FONT_SANS,
            fontSize: 11.5,
            color: live.isActive ? '#f2f4ff' : '#dfe3fb',
            background: live.isActive ? 'rgba(146,166,255,.3)' : 'rgba(255,255,255,.07)',
            border: 0,
            borderRadius: 9,
            padding: '6px 11px',
            cursor: sessionId ? 'pointer' : 'default',
            opacity: sessionId ? 1 : 0.5,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: live.isActive ? '#b3c0ff' : COLORS.layers.data, boxShadow: live.isActive ? '0 0 8px #b3c0ff' : 'none' }} />
          {live.isActive ? 'Stop voice' : 'Voice query'}
        </button>
      </div>

      {/* Orb stage */}
      <div style={{ flexShrink: 0 }}>
        <GeminiOrb state={orbState} />
        {live.error && (
          <div style={{ marginTop: -8, marginBottom: 8, fontSize: 10, color: COLORS.fail, textAlign: 'center', lineHeight: 1.5, padding: '0 16px' }}>
            {live.error}
          </div>
        )}
      </div>

      {/* Message feed */}
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ color: COLORS.textGhost, fontSize: 12, paddingTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
            Ask anything about the architecture via voice or text
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} scopeColor={scopeColor} onTraceClick={onTraceClick} />
        ))}

        {chatLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 4 }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: '50%', background: COLORS.layers.data,
                  animation: `blink 1.2s infinite ${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div style={{ flexShrink: 0, padding: '14px 20px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <textarea
          value={chatInput}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={live.isActive ? 'Mic is open — say it instead' : `Ask about the ${(LAYER_NAMES[activeLayerIndex] || '').toLowerCase()} layer…`}
          disabled={live.isActive}
          rows={1}
          style={{
            flex: 1,
            borderRadius: 12,
            background: 'rgba(255,255,255,.06)',
            border: 'none',
            outline: 'none',
            padding: '11px 13px',
            color: '#e6e9fb',
            fontFamily: FONT_SANS,
            fontSize: 12.5,
            resize: 'none',
            lineHeight: 1.4,
            maxHeight: 100,
            overflowY: 'auto',
          }}
        />
        <button
          onClick={() => {
            if (chatInput.trim()) onSend(chatInput);
          }}
          disabled={!canSend || chatLoading}
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 12,
            border: 0,
            background: canSend ? 'linear-gradient(140deg,#b3c0ff,#92a6ff)' : 'rgba(255,255,255,.08)',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: canSend ? '0 8px 20px rgba(146,166,255,.4)' : 'none',
          }}
        >
          <svg width="14" height="12" viewBox="0 0 14 12">
            <path d="M0 6h11M7 2l4 4-4 4" stroke={canSend ? '#0b0e1d' : '#7b83aa'} strokeWidth={1.7} fill="none" strokeLinecap="round" />
          </svg>
        </button>
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
            maxWidth: '86%',
            borderRadius: '16px 16px 5px 16px',
            padding: '12px 14px',
            background: 'linear-gradient(150deg, rgba(146,166,255,.28), rgba(146,166,255,.14))',
            boxShadow: '0 10px 24px rgba(0,0,0,.35)',
            fontSize: 13,
            lineHeight: 1.5,
            color: '#f2f4ff',
          }}
        >
          {msg.text}
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div style={{ maxWidth: '98%', borderRadius: '16px 16px 16px 5px', padding: '15px 16px', background: 'rgba(240,185,138,.08)', boxShadow: 'inset 0 0 0 1px rgba(240,185,138,.28)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
          <svg width="12" height="14" viewBox="0 0 10 12">
            <rect x="1" y="5" width="8" height="6" rx="1.6" fill="none" stroke="#f0b98a" />
            <path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="#f0b98a" />
          </svg>
          <span style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '.06em', textTransform: 'uppercase', color: COLORS.cost }}>
            Behind the fog{msg.block?.locked_layer_name ? ` — ${msg.block.locked_layer_name}` : ''}
          </span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: '#f3d4b8' }}>{msg.block?.hint || msg.text}</div>
      </div>
    );
  }

  const claims = msg.claims || [];
  const hasClaims = claims.length > 0;

  return (
    <div style={{ maxWidth: '98%' }}>
      <div
        style={{
          borderRadius: '16px 16px 16px 5px',
          padding: '15px 16px',
          background: 'rgba(255,255,255,.05)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 12px 28px rgba(0,0,0,.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {hasClaims ? (
          claims.map((claim, i) => (
            <div key={i}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '.06em', textTransform: 'uppercase', color: '#a9b5ff', marginBottom: 7 }}>
                Claim
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#f2f4ff', marginBottom: claim.tradeoff ? 14 : 0 }}>
                {claim.text}
              </div>
              {claim.tradeoff && (
                <div style={{ paddingTop: 13, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.09)' }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '.06em', textTransform: 'uppercase', color: COLORS.cost, marginBottom: 7 }}>
                    Cost
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, fontWeight: 300, color: COLORS.textSecondary }}>
                    {claim.tradeoff}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#f2f4ff' }}>{msg.text}</div>
        )}
      </div>

      {(msg.trace_path || []).length > 0 && onTraceClick && (
        <button
          onClick={() => onTraceClick!(msg.trace_path!)}
          style={{
            marginTop: 11,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontFamily: FONT_SANS,
            fontSize: 11.5,
            color: scopeColor,
            background: `${scopeColor}22`,
            border: 0,
            borderRadius: 10,
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="8"><path d="M1 4h18" stroke={scopeColor} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="2 6" /></svg>
          Highlight path on diagram
        </button>
      )}
    </div>
  );
};
