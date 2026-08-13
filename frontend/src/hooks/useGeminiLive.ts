import { useCallback, useRef, useState } from 'react';
import { MicStreamer, LiveAudioPlayer } from '../lib/liveAudio';
import type { OrbState } from '../canvas/GeminiOrb';

const API = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000';

interface UseGeminiLiveResult {
  state: OrbState;
  isActive: boolean;
  error: string | null;
  toggle: () => void;
}

/** Drives a live voice session against the backend's Gemini bridge (routes_live.py). */
export function useGeminiLive(sessionId: string | undefined, onTurnComplete?: () => void): UseGeminiLiveResult {
  const [state, setState] = useState<OrbState>('idle');
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const micRef = useRef<MicStreamer | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    setIsActive(false);
    micRef.current?.stop();
    micRef.current = null;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }
    wsRef.current?.close();
    wsRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    setState('idle');
  }, []);

  const start = useCallback(() => {
    if (!sessionId || activeRef.current) return;
    activeRef.current = true;
    setIsActive(true);
    setError(null);

    const wsBase = API.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBase}/api/sessions/${sessionId}/live`);
    wsRef.current = ws;
    const player = new LiveAudioPlayer();
    playerRef.current = player;

    ws.onmessage = async (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'ready': {
          setState('listening');
          const mic = new MicStreamer();
          micRef.current = mic;
          try {
            await mic.start((b64) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'audio', data: b64 }));
              }
            });
          } catch (e: any) {
            setError(e?.message || 'Microphone permission denied.');
            stop();
          }
          break;
        }
        case 'audio':
          setState('speaking');
          player.enqueue(msg.data);
          break;
        case 'interrupted':
          player.flush();
          setState('listening');
          break;
        case 'turn_complete': {
          // Let queued audio actually finish playing before settling the orb.
          const settle = () => {
            if (player.isPlaying) {
              setTimeout(settle, 150);
              return;
            }
            setState(activeRef.current ? 'listening' : 'idle');
            onTurnComplete?.();
          };
          settle();
          break;
        }
        case 'error':
          setError(msg.message);
          stop();
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      setError('Voice connection failed.');
      stop();
    };

    ws.onclose = () => {
      if (activeRef.current) stop();
    };
  }, [sessionId, onTurnComplete, stop]);

  const toggle = useCallback(() => {
    if (activeRef.current) stop();
    else start();
  }, [start, stop]);

  return { state, isActive, error, toggle };
}
