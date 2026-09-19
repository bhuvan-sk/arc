# Architecture Explainer

### [Start Here](https://github.com/bhuvan-sk) (Back to Profile)

# Architecture Explainer

Upload an existing system's architecture diagram or design doc and get it taught back to you layer by layer — Data → API → Infra — on a progressive-reveal canvas, with a scoped chat panel and live voice, grounded in [Designing Data-Intensive Applications](https://dataintensive.net/) reasoning: every explanation states a fact, then its tradeoff.

## What it does

1. **Upload** a diagram (PNG/JPG/PDF) or a design doc (PDF/DOCX/TXT/MD).
2. **Parse** — an LLM extracts components, connections, and facts into a structured JSON graph. Nothing downstream is allowed to invent data that isn't in this graph.
3. **Bucket** — components are sorted into three fixed layers (Data / API / Infra) by deterministic rules, not LLM guessing.
4. **Reveal** — the canvas and the accompanying write-up unlock one layer at a time. A locked layer cannot be asked about in chat, and an empty layer says so plainly instead of inventing detail.
5. **Explain** — chat and narration answer only from the structured graph, in a senior-solutions-architect voice: state the fact, then the DDIA-grounded tradeoff (reliability / scalability / maintainability).
6. **Talk** — a live voice mode (Gemini Live) lets you ask about the unlocked layers out loud instead of typing.
7. **Export** — write up whatever's been unlocked so far as a PDF or DOCX.

### Modes

- **Mode A — Upload only** (default, fully implemented): extracts strictly what's stated in the uploaded material. If a layer has no information in the source, it's marked "not enough info" rather than filled in.
- **Mode B — Research mode** (UI present, backend not yet implemented): intended to infer missing layers from public architectural best practice, with every inferred fact tagged and sourced. The `/research` endpoint currently returns a stub — this is the next piece to build.

## Architecture

```
backend/    FastAPI + MongoDB (Motor) + OpenAI (parse/narrate/chat) + Gemini Live (voice)
frontend/   React + TypeScript + Vite + Zustand, hand-rolled SVG canvas
```

**Backend** (`backend/app/`)
- `pipeline/` — parse → bucket → scale_rules → coverage → narrate → explain. Bucketing, scale-band decisions, and coverage classification are plain deterministic Python, never an LLM call — the LLM only writes prose around a decision that's already been made.
- `api/` — FastAPI routes: sessions, layers (unlock/activate/regenerate/research), chat, export, and the Gemini Live WebSocket bridge (`routes_live.py`).
- `llm/` — OpenAI client wrapper (structured JSON output, retry/backoff) and the Gemini Live grounding logic.
- `db/` — Mongo repository (one document per session, holding the graph, layers, chat history, and export records).
- `export/` — PDF/DOCX write-up generation.

**Frontend** (`frontend/src/`)
- `canvas/` — the SVG diagram: nodes, edges, sequence badges, the "GeminiOrb" voice-state visualization.
- `panels/` — layer tabs, the document panel, the chat panel.
- `lib/layout/` — deterministic grid layout for nodes within a layer (handles arbitrary node counts per layer without overlap).
- `hooks/useGeminiLive.ts` + `lib/liveAudio.ts` — mic capture, PCM streaming, and gapless audio playback for the voice bridge.
- `store/useAppStore.ts` — all client state (Zustand): current session, chat, upload/poll flow, session list.

### Why two "AI providers"

OpenAI powers the text pipeline (parsing, narration, DDIA-grounded chat answers). Gemini Live powers real-time voice — a genuinely different capability (bidirectional audio streaming) that OpenAI's chat API doesn't provide. Both keys are used server-side only; neither reaches the browser.

## Running it

### Backend

```sh
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env   # then fill in the values below
uvicorn app.main:app --reload --port 8000
```

Required in `backend/.env`:

| Variable | Purpose |
|---|---|
| `MONGO_URI`, `MONGO_DB` | MongoDB connection (a local `mongod` is enough for development) |
| `OPENAI_API_KEY` | Parsing, layer narration, chat answers |
| `OPENAI_BASE_URL` | Optional — set if using an Azure OpenAI / OpenAI-compatible endpoint instead of api.openai.com |
| `GEMINI_API_KEY` | Live voice chat. Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Leave blank to disable voice — the mic button will show a clear "not configured" message rather than fail silently |

See `backend/.env.example` for the full list, including per-pipeline-stage model overrides.

### Frontend

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. It talks to the backend at `http://localhost:8000` by default (override with `VITE_API_URL`).

### Tests

```sh
cd backend && pytest
cd frontend && npm test
```

## Known limitations

- Mode B (research-backed gap-filling) is UI-only; the backend endpoint is a stub.
- The Gemini Live voice bridge requires a Google Cloud project with Live API access enabled — a fresh/free-tier key may return `PERMISSION_DENIED` until that's granted.
- No auth — this is a local/single-user dev tool as it stands.

