import React, { useRef, useEffect } from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface GeminiOrbProps {
  state: OrbState;
  size?: number;
}

const CAPTIONS: Record<OrbState, string> = {
  idle: 'Loose cloud drifting in slow orbit.',
  listening: 'Cloud contracts, brightens, holds steady.',
  thinking: 'Swarm spirals into a searching double-orbit.',
  speaking: 'Bursts outward in sync with each phrase.',
};

const STATE_COLORS: Record<OrbState, string> = {
  idle: 'rgba(255,255,255,.32)',
  listening: '#4c8df6',
  thinking: '#a273f2',
  speaking: '#46b980',
};

function fibonacciSphere(n: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const offset = 2 / n;
  const inc = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * inc;
    pts.push([Math.cos(phi) * r, y, Math.sin(phi) * r]);
  }
  return pts;
}

const TARGETS: Record<OrbState, { radiusScale: number; speed: number; wobble: number; burst: number }> = {
  idle: { radiusScale: 1, speed: 0.18, wobble: 0.06, burst: 0 },
  listening: { radiusScale: 0.68, speed: 0.09, wobble: 0.02, burst: 0 },
  thinking: { radiusScale: 0.86, speed: 0.55, wobble: 0.55, burst: 0 },
  speaking: { radiusScale: 1.02, speed: 0.3, wobble: 0.08, burst: 1 },
};

export const GeminiOrb: React.FC<GeminiOrbProps> = ({ state = 'idle', size = 168 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OrbState>(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseR = 54;
    const N = 90;
    const pts = fibonacciSphere(N);
    const phases = pts.map(() => Math.random() * Math.PI * 2);

    let cur = { ...TARGETS[stateRef.current] };
    let angleY = 0;
    let angleX = 0;
    let scanPos = 0;
    let last = performance.now();
    let animId: number;

    function loop(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      const currentState = stateRef.current;
      const tgt = TARGETS[currentState] || TARGETS.idle;

      for (const k in cur) {
        const key = k as keyof typeof cur;
        cur[key] += (tgt[key] - cur[key]) * Math.min(1, dt * 3.2);
      }

      angleY += cur.speed * dt;
      if (currentState === 'thinking') {
        angleX += cur.speed * 0.5 * dt * cur.wobble * 2;
      }
      scanPos = Math.sin(t * 0.7);

      ctx!.clearRect(0, 0, size, size);
      const amp = cur.burst * (0.16 * Math.sin(t * 6) + 0.11 * Math.sin(t * 13.7) + 0.08 * Math.sin(t * 22));

      for (let i = 0; i < N; i++) {
        const [x, y, z] = pts[i];
        const cY = Math.cos(angleY);
        const sY = Math.sin(angleY);
        const x1 = x * cY - z * sY;
        const z1 = x * sY + z * cY;
        const cX = Math.cos(angleX);
        const sX = Math.sin(angleX);
        const y1 = y * cX - z1 * sX;
        const z2 = y * sX + z1 * cX;

        const ampI = amp * (0.7 + 0.3 * Math.sin(t * 3 + i));
        const r = baseR * cur.radiusScale * (1 + ampI);
        const scale = 1 + z2 * 0.35;
        const px = cx + x1 * r * scale;
        const py = cy + y1 * r * scale;

        let alpha = 0.22 + 0.55 * ((z2 + 1) / 2);
        alpha *= 0.7 + 0.3 * Math.sin(t * 2 + phases[i]);
        if (currentState === 'thinking' && Math.abs(y1 - scanPos) < 0.16) {
          alpha = Math.min(1, alpha + 0.45);
        }

        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
        ctx!.arc(px, py, 1.1 + 1.5 * ((z2 + 1) / 2), 0, Math.PI * 2);
        ctx!.fill();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <div
      style={{
        background: '#0b0b0d',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 20,
        padding: '16px 16px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 20px 50px rgba(0,0,0,.35)',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          font: '10px/1 ui-monospace, Menlo, monospace',
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,.42)',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#f5f5f7',
            animation: 'dotPulse 2.4s ease-in-out infinite',
          }}
        />
        GEMINI LIVE · VOICE & CHAT
      </div>

      {/* Canvas Orb Stage */}
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', flex: 'none' }}>
        <canvas ref={canvasRef} style={{ width: size, height: size }} />
      </div>

      {/* Live state readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: STATE_COLORS[state],
            boxShadow: state !== 'idle' ? `0 0 6px ${STATE_COLORS[state]}` : 'none',
            transition: 'background .2s, box-shadow .2s',
          }}
        />
        <span
          style={{
            font: '10px/1 ui-monospace, Menlo, monospace',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.55)',
          }}
        >
          {state}
        </span>
      </div>

      {/* State Caption */}
      <div
        style={{
          font: '11px/1.45 system-ui, sans-serif',
          color: 'rgba(255,255,255,.42)',
          textAlign: 'center',
          minHeight: 28,
          maxWidth: 230,
        }}
      >
        {CAPTIONS[state] || CAPTIONS.idle}
      </div>
    </div>
  );
};
