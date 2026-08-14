import React from 'react';
import { FONT_MONO } from '../theme/tokens';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface GeminiOrbProps {
  state: OrbState;
  size?: number;
}

interface VoiceStyle {
  label: string;
  labelColor: string;
  core: string;
  shadow: string;
  glow: string;
  ring: string;
  ring2: string;
  haloDur: string;
  breatheDur: string;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
}

const STYLES: Record<OrbState, VoiceStyle> = {
  idle: {
    label: 'idle — tap to speak', labelColor: '#8f97bd',
    core: 'radial-gradient(circle at 34% 30%,#cdd6ff,#7f92f5 45%,#3c4699 100%)',
    shadow: '0 0 44px rgba(146,166,255,.45)', glow: 'rgba(146,166,255,.42)',
    ring: 'rgba(146,166,255,.4)', ring2: 'rgba(146,166,255,.25)', haloDur: '3.6s', breatheDur: '4.2s',
    isListening: false, isThinking: false, isSpeaking: false,
  },
  listening: {
    label: 'listening', labelColor: '#dfe3fb',
    core: 'radial-gradient(circle at 34% 30%,#e6ebff,#8ea2ff 42%,#4552b8 100%)',
    shadow: '0 0 70px rgba(146,166,255,.85)', glow: 'rgba(146,166,255,.7)',
    ring: 'rgba(179,192,255,.75)', ring2: 'rgba(179,192,255,.45)', haloDur: '1.8s', breatheDur: '1.6s',
    isListening: true, isThinking: false, isSpeaking: false,
  },
  thinking: {
    label: 'thinking', labelColor: '#a9b5ff',
    core: 'radial-gradient(circle at 34% 30%,#aab5e8,#5f6bb8 45%,#2c3372 100%)',
    shadow: '0 0 34px rgba(146,166,255,.35)', glow: 'rgba(146,166,255,.3)',
    ring: 'rgba(146,166,255,.2)', ring2: 'rgba(146,166,255,.1)', haloDur: '5s', breatheDur: '3s',
    isListening: false, isThinking: true, isSpeaking: false,
  },
  speaking: {
    label: 'speaking', labelColor: '#7fe6c6',
    core: 'radial-gradient(circle at 34% 30%,#d8fff4,#5fdcb8 42%,#1c6d5a 100%)',
    shadow: '0 0 66px rgba(79,214,176,.75)', glow: 'rgba(79,214,176,.6)',
    ring: 'rgba(79,214,176,.6)', ring2: 'rgba(79,214,176,.3)', haloDur: '1.4s', breatheDur: '1.1s',
    isListening: false, isThinking: false, isSpeaking: true,
  },
};

export const GeminiOrb: React.FC<GeminiOrbProps> = ({ state = 'idle', size = 196 }) => {
  const s = STYLES[state] || STYLES.idle;

  return (
    <div
      style={{
        height: size,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${s.glow}, transparent 60%)`,
          filter: 'blur(28px)',
          animation: 'drift 9s ease-in-out infinite',
        }}
      />
      <div style={{ position: 'relative', width: 112, height: 112, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `inset 0 0 0 1px ${s.ring}`, animation: `haloout ${s.haloDur} ease-out infinite` }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `inset 0 0 0 1px ${s.ring2}`, animation: `haloout ${s.haloDur} ease-out infinite 1.2s` }} />
        {s.isThinking && (
          <div
            style={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              border: '1px solid transparent',
              borderTopColor: '#b3c0ff',
              borderRightColor: 'rgba(179,192,255,.3)',
              animation: 'spinslow 1.6s linear infinite',
            }}
          />
        )}
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: '50%',
            background: s.core,
            boxShadow: `${s.shadow}, inset 0 -8px 18px rgba(10,13,30,.6)`,
            animation: `breathe ${s.breatheDur} ease-in-out infinite`,
          }}
        />
        {s.isListening && (
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 4, height: 34 }}>
            {[12, 22, 32, 20, 11].map((h, i) => (
              <span
                key={i}
                style={{
                  width: 3,
                  height: h,
                  borderRadius: 2,
                  background: i === 2 ? '#ffffff' : '#eaeeff',
                  animation: `bar .9s ease-in-out infinite ${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        )}
        {s.isSpeaking && (
          <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', boxShadow: 'inset 0 0 0 1px rgba(79,214,176,.5)', animation: 'haloout 1.4s ease-out infinite' }} />
        )}
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase', color: s.labelColor }}>
        {s.label}
      </span>
    </div>
  );
};
