# UI Redesign Brief — Architecture Explainer

Paste this whole document into a new conversation. It's a self-contained design brief for a **visual reskin** of an existing, fully-functional web app. Read it fully before proposing anything.

## The product, in one paragraph

"Architecture Explainer" ingests a system's architecture diagram or design doc and teaches it back layer-by-layer — **Data → API → Infra** — on a progressive-reveal canvas, with a scoped chat panel (text + live voice) grounded in DDIA (*Designing Data-Intensive Applications*) reasoning: every explanation states a fact, then its tradeoff. A user uploads a diagram, watches it get parsed into a structured graph, then unlocks one architectural layer at a time — each unlock reveals new nodes/connections on the diagram and a matching written narrative, and the chat is scoped so you can't ask about (or see) a layer you haven't unlocked yet.

## Your job

Redesign the **visual language only** — color, type, layout, spacing, iconography, motion, the overall "feel." You have full creative license here; the current design is functional but visually generic (a flat dark dev-tool look with lots of thin-bordered boxes and pills) and the goal is something genuinely sleek and distinctive. Nothing about *what data appears where* or *what a user can click* should change unless a screen genuinely calls for restructuring to serve the new visual system better — but every current capability listed below must still exist somewhere in your redesign. Treat this as re-skinning a fully-spec'd product, not inventing a new one.

**Before generating final designs, propose 3–4 distinct visual directions** (each a short description + a feel/mood — think along the lines of "precision blueprint," "cinematic data-viz," "editorial technical documentation," "premium SaaS minimalism" — but come up with your own, don't just reuse these labels). For each, briefly note the type system, palette approach, and what makes it distinct from the others. Wait for a direction to be picked before building full mockups. Avoid defaulting to any single "house style" — genuinely vary the directions from each other.

## Hard constraints (must preserve)

- **Implementation stack**: React + TypeScript, hand-rolled SVG for the diagram canvas (not a chart library — nodes/edges/labels are custom SVG so precise custom visuals are achievable). Whatever you design needs to be buildable as real React components and SVG, not just a static image.
- **Base structure**: top bar → (layer tabs, when a session is loaded) → three-pane workspace (doc panel / canvas / chat panel, some panes collapsible via a view-mode switch) → landing/upload screen shown when no session is loaded. This shell can be reshuffled but the functional zones below must all survive.
- **Dark mode** is the existing choice (this is a technical/developer tool used for extended reading); staying dark is expected but you have full freedom on *which* dark — not obligated to keep near-black `#0f0f11`.
- Typography currently: Inter (UI text) + JetBrains Mono (labels, ids, numeric/mono data). You can swap these, but keep a clear **sans/mono pairing** — timestamps, session ids, metric values, and edge/protocol labels read as data and benefit from a monospace treatment somewhere in the system.

## Every current screen and exactly what it shows (nothing here may be dropped)

### 1. Top bar (48px strip, always visible once inside the app)
- App logo mark + product title
- Session subtitle (e.g. "architecture")
- Live status dot + label: Ready / Ingesting… / Parsing… / Bucketing… / Narrating… / Failed (color-coded)
- "Upload PDF / Doc" button (opens the upload modal from within a session)
- View-mode switch: **Document / Both / Canvas** (segmented control — shows doc panel only, all three panes, or canvas only)
- Zoom control: − / percentage / +
- Export buttons: "Export PDF", "Export DOCX" (only shown once session status is Ready)
- A small session-id chip (monospace, low-emphasis)

### 2. Layer tabs (only shown once a session is loaded and ready)
- Three tabs: **Data / API / Infra**, in fixed order
- Locked tabs show a lock icon and are unclickable
- Active tab has a colored underline matching that layer's type color
- Clicking any *unlocked* tab makes it active (does not change the unlock frontier)

### 3. Layer doc panel (left column in Document/Both mode)
- Kicker text: "LAYER 0X OF 03 · {NAME}"
- Big title = the layer's narrative headline (or a placeholder dash treatment if the layer is locked)
- Colored accent bar matching layer type
- Body, one of three states:
  - **Locked**: a locked message, no content
  - **Insufficient info**: a plainly-worded "not enough info in the source for this layer" box — this honesty is a core product value, must stay visually distinct from a real empty/error state
  - **Populated**: a narrative paragraph, a list of components (each with a title + one-line description, left border colored by component type), and a **Scale Decisions** section (a concern label like "replication," a decision sentence, a one-line tradeoff)
- A "Next Layer" button (also triggerable via a keyboard shortcut) — only shown when there's a next layer to unlock

### 4. Canvas (the core diagram — center pane)
- Dark background, subtle dot/grid texture
- Layer band labels (e.g. "LAYER 01 — DATA")
- Node cards: icon tile + title + subtitle, colored border/tint by component type (database / service / queue / infrastructure / external), a distinct visual treatment for "inferred" (not explicitly stated in the source) components
- Connections between nodes: color follows the source node's type, line style encodes transport (sync / async / replication / bidirectional — e.g. solid vs. dashed vs. animated dash)
- Small numbered sequence badges on connections showing step order (e.g. for "what happens when a user does X" flows)
- Small text labels on connections describing what's actually flowing (e.g. "payment request," not a generic "sync call" placeholder) — **this must read like a real system-design diagram (Eraser.io-style), not decorative**
- Occasional small metric pills on connections (e.g. latency/throughput figures) where the data has them
- Locked layers are present but heavily dimmed; the active layer is full-opacity; unlocked-but-inactive layers sit at partial opacity — this "fog of layers" is core to the progressive-reveal concept and must be preserved as *some* clear visual gradient of emphasis
- Nodes/edges animate in when a layer unlocks
- Pan/zoom

### 5. Chat panel (right column, "Both" view mode only)
- A voice-orb visualization (currently an animated particle sphere) with a state readout: idle / listening / thinking / speaking
- Header showing which layer the chat is currently scoped to (colored dot + layer name)
- A "Voice Query" toggle (start/stop a live voice conversation — real-time bidirectional audio, not just speech-to-text)
- Scrolling message feed: user messages vs. assistant messages visually distinct; assistant answers are structured as one or more **claim + tradeoff** pairs (a fact, then its cost); a message can be **blocked** (user asked about a locked layer) and that state needs a clearly different, "you can't see this yet" visual treatment (currently amber/locked styling) rather than looking like a normal answer or an error
- An assistant message that references specific diagram elements can offer a "Highlight path on diagram" action that cross-highlights the relevant connections on the canvas
- A typing/thinking indicator
- Text input + send button, disabled/placeholder-appropriate while voice mode is active

### 6. Landing / upload screen (shown when no session is loaded)
- Logo + product title + short description
- A dropzone (drag-and-drop or click-to-browse) accepting PDF/PNG/JPG/DOCX/TXT/MD
- Optional title field
- Optional "context / problem statement" textarea
- A mode selector: **Mode A** ("Upload only" — extract strictly what's in the file) vs **Mode B** ("Research mode" — fill gaps from public best practice, UI exists, backend currently stubbed — still needs to be a visible choice)
- Primary submit action ("Parse & Generate")
- A shortcut to load a bundled demo session
- A **Recent Sessions** list: each row shows a status dot (ready/failed/processing, processing pulses), the session title, a component count, and a relative timestamp ("2h ago"); clicking a row loads that session

### 7. Upload modal (same upload form as the landing screen, but as an in-session modal/overlay triggered from the top bar, so a user can start a new session without leaving one)

### 8. Processing / status splash (shown while a session is ingesting/parsing/bucketing/narrating, replaces the whole workspace)
- Animated logo
- Current stage label (e.g. "Extracting components…")
- A 4-stage progress indicator (filled / current / pending)
- Two distinct non-happy-path states that must look *different from each other*: (a) a real backend failure ("Pipeline failed" + reason), and (b) the frontend simply gave up polling but the job might still be running server-side ("Still working…" + a manual "Check again" button) — conflating these two was a real bug already fixed once; the redesign must keep them visually distinguishable (failure should read as alarming/red, "still working" should read as calm/neutral, not alarming)

## Current visual pain points to actually fix (not just reskin around)

- Everything is a thin-bordered rounded box — pills, chips, cards, panels all use the same weight of border and radius, so there's no real visual hierarchy, it all reads as "the same gray box" repeated dozens of times
- Icon tiles, status dots, and badges are small and visually busy when many are on-screen at once (e.g. a canvas with a dozen nodes)
- Very little use of type scale/weight to create hierarchy — most text sits in a narrow 11–14px band
- No real signature visual moment — nothing about it currently feels distinctive or memorable, it reads as "generic AI-generated dark dev tool"

## Deliverable

Once a direction is picked: produce (1) a compact design system reference (palette with light/dark rationale if relevant, type scale, spacing scale, iconography approach, motion principles) and (2) a full interactive mockup of the primary in-session workspace (top bar + layer tabs + doc panel + canvas with a populated multi-layer diagram + chat panel, in "Both" view mode) built as a single self-contained HTML/CSS/JS artifact, using placeholder data modeled on the fields above. Prefer building this as an interactive artifact over a static image — being able to click between layer tabs / hover nodes / see the locked-layer dimming actually working is far more useful for evaluating the design than a flat screenshot.
