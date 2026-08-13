"""Gate 3: Deterministic intent classifier — runs before any LLM call.

Checks if question matches locked-layer component names, aliases, or lexicon terms.
"""
from typing import Optional
from dataclasses import dataclass
from app.rules.layer_lexicon import LAYER_LEXICON


@dataclass
class ScopeBlock:
    blocked: bool
    locked_layer_index: Optional[int] = None
    locked_layer_name: Optional[str] = None
    matched_terms: list[str] = None
    hint: Optional[str] = None


def classify_scope(question: str, session: dict) -> ScopeBlock:
    """
    Check if the user is asking about a locked layer.
    Returns ScopeBlock (blocked=True if asking about locked layer).
    """
    unlocked_index = session.get("unlocked_index", 0)
    layers = session.get("layers", [])
    graph = session.get("graph", {})
    nodes = graph.get("nodes", [])

    q_lower = question.lower()

    # Find all locked layers
    locked_layers = [l for l in layers if l.get("index", 0) > unlocked_index]

    if not locked_layers:
        return ScopeBlock(blocked=False, matched_terms=[])

    for layer in locked_layers:
        li = layer["index"]
        lname = layer["name"]
        l_id = layer["id"]

        matched: list[str] = []

        # 1. Check lexicon terms for this layer
        lexicon_terms = LAYER_LEXICON.get(l_id, [])
        for term in lexicon_terms:
            if term in q_lower:
                matched.append(term)

        # 2. Check nodes assigned to this locked layer
        for n in nodes:
            if n.get("layer_index") == li:
                label = (n.get("label") or "").lower()
                if label and label in q_lower:
                    matched.append(label)
                for alias in n.get("aliases", []):
                    if alias.lower() in q_lower:
                        matched.append(alias)

        if matched:
            hint = (
                f"Layer 0{li + 1} ({lname}) is currently locked. "
                f"Advance to Layer 0{li + 1} using the Next Layer button or ⇧N to unlock answers about {', '.join(set(matched))}."
            )
            return ScopeBlock(
                blocked=True,
                locked_layer_index=li,
                locked_layer_name=lname,
                matched_terms=list(set(matched)),
                hint=hint,
            )

    return ScopeBlock(blocked=False, matched_terms=[])
