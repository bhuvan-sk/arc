"""Grounding for Gemini Live voice sessions.

Voice is a streaming modality: Gemini starts emitting audio as soon as it has
enough of the user's turn, so there is no point at which we can run the text
chat's post-hoc assert_grounded() check (pipeline/grounding.py) before audio
already reached the speaker. That check is Gate 4 in the text-chat design and
it simply has no equivalent moment in a live session.

The enforcement that *does* carry over is Gate 2: never give the model tokens
describing a locked layer in the first place. build_live_system_instruction()
is built from the exact same ScopedContext the text /chat endpoint uses
(pipeline/grounding.scoped_context), so a voice session is structurally
capable of discussing only what the text path could also discuss. Gates 1
(server-derived unlock index) and 3 (lexicon classifier) don't apply here —
there's no discrete "asked_layer_index" in a live turn, and no pre-generation
hook to run a classifier against before the model starts responding.
"""
from __future__ import annotations
from app.pipeline.grounding import ScopedContext


def build_live_system_instruction(session: dict, scoped: ScopedContext) -> str:
    title = session.get("title", "this system")
    layers = session.get("layers", [])
    unlocked_names = [
        layer.get("name", layer.get("id", "?"))
        for layer in layers
        if layer.get("index", 0) <= scoped.unlocked_index
    ]

    lines = [
        f'You are a senior solutions architect (Snowflake/Databricks/Stripe caliber) explaining '
        f'the architecture of "{title}" out loud, in a live voice conversation.',
        "",
        "Voice rules: keep answers SHORT, 2-4 sentences per turn, spoken cadence. No bullet "
        "lists, no markdown, never read out raw ids or URLs. If there's more to say, offer to go "
        "deeper rather than saying everything at once.",
        "",
        "Every substantive claim states a fact, then its tradeoff, grounded in one of Designing "
        "Data-Intensive Applications' three pillars: reliability, scalability, maintainability.",
        "",
        "You may ONLY discuss the layer(s) unlocked so far: "
        f"{', '.join(unlocked_names) if unlocked_names else 'none yet'}. If asked about anything "
        "else — a layer not listed above, or any component not described below — say plainly "
        "that it hasn't been revealed yet in this session and that unlocking the next layer will "
        "cover it. Never guess or invent detail about a locked layer, even if you recognize the "
        "technology from general knowledge. Everything you're allowed to know is listed below; "
        "nothing outside this list exists as far as you're concerned.",
        "",
        "--- What you know about this system (unlocked layers only) ---",
    ]

    if scoped.nodes:
        for node in scoped.nodes:
            subtitle = node.get("subtitle") or ""
            lines.append(f"- Component \"{node.get('label')}\" ({node.get('type')}): {subtitle}")
    else:
        lines.append("(No components unlocked yet. Invite the user to unlock the first layer.)")

    for conn in scoped.connections:
        label = conn.get("label") or conn.get("transport", "")
        lines.append(f"- {conn.get('source')} -> {conn.get('target')}: {label}")

    for fact in scoped.facts:
        stmt = fact.get("statement", "")
        tradeoff = fact.get("tradeoff", "")
        lines.append(f"- Fact: {stmt} Tradeoff: {tradeoff}")

    return "\n".join(lines)
