"""Grounding: scoped context builder and post-answer assertion."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass


@dataclass
class ScopedContext:
    """All graph content visible at a given unlocked_index snapshot."""
    unlocked_index: int
    nodes: list[dict]              # node dicts with layer_index <= unlocked
    connections: list[dict]        # connections with max_layer_index <= unlocked
    facts: list[dict]              # facts with layer_index <= unlocked
    node_ids: set[str] = field(default_factory=set)
    connection_ids: set[str] = field(default_factory=set)
    fact_ids: set[str] = field(default_factory=set)

    def __post_init__(self):
        self.node_ids = {n["id"] for n in self.nodes}
        self.connection_ids = {c["id"] for c in self.connections}
        self.fact_ids = {f["id"] for f in self.facts}


class GroundingError(Exception):
    pass


def scoped_context(session: dict, unlocked_index: int) -> ScopedContext:
    """
    Build a ScopedContext from a session doc at the given unlocked_index.
    
    For Phase 1/2 testing when layers haven't been bucketed yet,
    pass unlocked_index=999 to get all content.
    """
    graph = session.get("graph", {})
    all_nodes = graph.get("nodes", [])
    all_connections = graph.get("connections", [])
    all_facts = graph.get("facts", [])

    # Filter by layer_index if present; otherwise include all (pre-bucketing)
    def node_visible(n: dict) -> bool:
        li = n.get("layer_index")
        if li is None:
            return True  # pre-bucketing: include all
        return li <= unlocked_index

    def conn_visible(c: dict) -> bool:
        mli = c.get("max_layer_index")
        if mli is None:
            return True  # pre-bucketing: include all
        return mli <= unlocked_index

    def fact_visible(f: dict) -> bool:
        li = f.get("layer_index")
        if li is None:
            return True  # pre-bucketing: include all
        return li <= unlocked_index

    visible_nodes = [n for n in all_nodes if node_visible(n)]
    visible_connections = [c for c in all_connections if conn_visible(c)]
    visible_facts = [f for f in all_facts if fact_visible(f)]

    return ScopedContext(
        unlocked_index=unlocked_index,
        nodes=visible_nodes,
        connections=visible_connections,
        facts=visible_facts,
    )


def assert_grounded(answer: dict, scoped: ScopedContext) -> None:
    """
    Validate that every id in an answer exists in the scoped context.
    Raises GroundingError listing all out-of-scope ids.
    """
    violations: list[str] = []

    for claim in answer.get("claims", []):
        for fid in claim.get("fact_ids", []):
            if fid not in scoped.fact_ids:
                violations.append(f"fact_id {fid!r} not in scoped facts")

    for nid in answer.get("node_refs", []):
        if nid not in scoped.node_ids:
            violations.append(f"node_ref {nid!r} not in scoped nodes")

    for cid in answer.get("connection_refs", []):
        if cid not in scoped.connection_ids:
            violations.append(f"connection_ref {cid!r} not in scoped connections")

    for cid in answer.get("trace_path", []):
        if cid not in scoped.connection_ids:
            violations.append(f"trace_path {cid!r} not in scoped connections")

    if violations:
        raise GroundingError(
            f"Answer references {len(violations)} out-of-scope ids:\n" +
            "\n".join(f"  - {v}" for v in violations)
        )
