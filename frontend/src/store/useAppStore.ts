import { create } from 'zustand';
import { SessionData, ChatMessage, SessionSummary } from '../api/types';

const API = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000';

export interface AppState {
  session: SessionData | null;
  loading: boolean;
  polling: boolean;
  error: string | null;
  /** We stopped polling without seeing 'ready' or 'failed' — the pipeline may
   * still be running or may have already finished; distinct from `error`,
   * which is reserved for an actual backend-reported failure. */
  pollTimedOut: boolean;
  chatLoading: boolean;
  chatInput: string;
  zoom: number;
  animLayerIndex: number;
  tracePath: string[];
  activeNodeId: string | null;
  viewMode: 'Document' | 'Both' | 'Canvas';
  sessionList: SessionSummary[];
  sessionListLoading: boolean;
  sessionListError: string | null;

  fetchSessionList: () => Promise<void>;
  loadSession: (sid: string) => Promise<void>;
  pollUntilReady: (sid: string) => Promise<void>;
  nextLayer: () => Promise<void>;
  activateLayer: (index: number) => Promise<void>;
  sendChat: (question: string) => Promise<void>;
  refreshChat: () => Promise<void>;
  setChatInput: (val: string) => void;
  setZoom: (z: number) => void;
  setTracePath: (ids: string[]) => void;
  setActiveNodeId: (id: string | null) => void;
  setViewMode: (m: 'Document' | 'Both' | 'Canvas') => void;
  exportSession: (format: 'pdf' | 'docx') => Promise<void>;
  uploadSession: (files: File[], mode: 'A' | 'B', problemStatement?: string, title?: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  loading: false,
  polling: false,
  error: null,
  pollTimedOut: false,
  chatLoading: false,
  chatInput: '',
  zoom: 100,
  animLayerIndex: -1,
  tracePath: [],
  activeNodeId: null,
  viewMode: 'Both',
  sessionList: [],
  sessionListLoading: false,
  sessionListError: null,

  fetchSessionList: async () => {
    set({ sessionListLoading: true, sessionListError: null });
    try {
      const res = await fetch(`${API}/api/sessions`);
      if (!res.ok) throw new Error(`Failed to list sessions: ${res.status}`);
      const data = await res.json();
      set({ sessionList: data.sessions || [], sessionListLoading: false });
    } catch (e: any) {
      set({ sessionListLoading: false, sessionListError: e.message });
    }
  },

  loadSession: async (sid: string) => {
    set({ loading: true, error: null, pollTimedOut: false });
    try {
      const res = await fetch(`${API}/api/sessions/${sid}`);
      if (!res.ok) throw new Error(`Session not found: ${res.status}`);
      const data: SessionData = await res.json();
      set({ session: data, loading: false });
      if (data.status !== 'ready') {
        get().pollUntilReady(sid);
      }
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  pollUntilReady: async (sid: string) => {
    set({ polling: true, pollTimedOut: false });
    let attempts = 0;
    // Backend worst case for a single LLM call: 90s client timeout x up to 3
    // manual retries + backoff ~= 275s. A real pipeline run can involve two
    // such calls (parse, then narrate for layer 0), so budget generously —
    // this is just a polling ceiling, it returns immediately once the job
    // actually reaches 'ready'. Previously this was 60x2s=120s, which was
    // *shorter* than the backend's legitimate worst case: a session that
    // took a bit over 2 minutes but still succeeded would get falsely
    // reported here as failed while the backend kept working in the
    // background and finished moments later.
    const maxAttempts = 200; // 200 x 3s = 600s (10 min)
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await fetch(`${API}/api/sessions/${sid}/status`);
        const data = await res.json();
        if (data.status === 'ready') {
          await get().loadSession(sid);
          set({ polling: false });
          return;
        }
        if (data.status === 'failed') {
          // A real backend-reported failure — this is the only case that
          // should ever show "Pipeline failed".
          set({ error: data.error || 'Pipeline failed', polling: false });
          return;
        }
        set(s => ({
          session: s.session ? { ...s.session, status: data.status } : s.session
        }));
      } catch {
        // Continue polling
      }
      attempts++;
    }
    // We stopped watching — this is NOT the same as the backend reporting
    // failure. The pipeline may well still be running (or may have already
    // finished) in the background. Never claim "failed" here.
    set({ polling: false, pollTimedOut: true });
  },

  nextLayer: async () => {
    const { session } = get();
    if (!session) return;
    const sid = session._id;

    try {
      const res = await fetch(`${API}/api/sessions/${sid}/layers/next`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      const newIndex = data.unlocked_index;

      set(s => ({
        session: s.session
          ? {
              ...s.session,
              unlocked_index: data.unlocked_index,
              active_index: data.active_index,
              layers: s.session.layers.map((l, i) =>
                i === newIndex && data.layer?.narrative
                  ? { ...l, narrative: data.layer.narrative }
                  : l
              ),
            }
          : s.session,
        animLayerIndex: newIndex,
      }));

      setTimeout(() => set({ animLayerIndex: -1 }), 1200);
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  activateLayer: async (index: number) => {
    const { session } = get();
    if (!session) return;
    if (index > session.unlocked_index) return;

    const sid = session._id;
    try {
      await fetch(`${API}/api/sessions/${sid}/layers/${index}/activate`, { method: 'POST' });
      set(s => ({
        session: s.session ? { ...s.session, active_index: index } : s.session,
      }));
    } catch {}
  },

  sendChat: async (question: string) => {
    const { session } = get();
    if (!session || !question.trim()) return;

    set({ chatLoading: true, chatInput: '' });

    // Optimistic user message
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      text: question,
      created_at: new Date().toISOString(),
      asked_layer_index: session.active_index,
    };
    set(s => ({
      session: s.session ? { ...s.session, chat: [...s.session.chat, tempMsg] } : s.session,
    }));

    try {
      const res = await fetch(`${API}/api/sessions/${session._id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, asked_layer_index: session.active_index }),
      });
      const data = await res.json();

      // Replace temp user message + add assistant message
      set(s => {
        if (!s.session) return s;
        const chatWithoutTemp = s.session.chat.filter(m => m.id !== tempMsg.id);
        const realUser: ChatMessage = { ...tempMsg, id: `user-${Date.now()}` };
        return {
          session: { ...s.session, chat: [...chatWithoutTemp, realUser, data.message] },
          chatLoading: false,
          tracePath: data.message.trace_path || [],
        };
      });
    } catch (e: any) {
      set({ chatLoading: false, error: e.message });
    }
  },

  refreshChat: async () => {
    const { session } = get();
    if (!session) return;
    try {
      const res = await fetch(`${API}/api/sessions/${session._id}/chat`);
      if (!res.ok) return;
      const data = await res.json();
      set((s) =>
        s.session ? { session: { ...s.session, chat: data.messages || [] } } : s
      );
    } catch {
      // best-effort — the voice turn is already persisted server-side either way
    }
  },

  setChatInput: (val: string) => set({ chatInput: val }),
  setZoom: (z: number) => set({ zoom: z }),
  setTracePath: (ids: string[]) => set({ tracePath: ids }),
  setActiveNodeId: (id: string | null) => set({ activeNodeId: id }),
  setViewMode: (m) => set({ viewMode: m }),
  exportSession: async (format: 'pdf' | 'docx') => {
    const { session } = get();
    if (!session) return;
    try {
      const res = await fetch(`${API}/api/sessions/${session._id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      const data = await res.json();
      if (data.export_id) {
        window.open(`${API}/api/sessions/${session._id}/exports/${data.export_id}`, '_blank');
      }
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  uploadSession: async (files: File[], mode: 'A' | 'B' = 'A', problemStatement?: string, title?: string) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('mode', mode);
      if (problemStatement) formData.append('problem_statement', problemStatement);
      if (title) formData.append('title', title);

      const res = await fetch(`${API}/api/sessions`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

      const data = await res.json();
      const sid = data.session_id;

      // Initialize session state
      set({
        session: {
          _id: sid,
          title: title || files[0]?.name || 'Uploaded Architecture',
          subtitle: 'architecture',
          session_mode: mode,
          status: 'ingesting',
          graph: { nodes: [], connections: [], facts: [] },
          layers: [],
          unlocked_index: 0,
          active_index: 0,
          chat: [],
        },
        loading: false,
      });

      // Start polling
      get().pollUntilReady(sid);
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },
}));
