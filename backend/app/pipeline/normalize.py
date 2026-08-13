"""Normalization passes for the parsed graph.

All functions here are pure Python — no LLM calls.
"""
import re
import logging
from app.models.graph import Graph, Node, Connection, Fact
from app.rules.taxonomy import assign_icon_key, is_valid_icon_key, ICON_REGISTRY

logger = logging.getLogger(__name__)

# Locators that are too generic to count as sourced
GENERIC_LOCATORS = {
    "", "unknown", "not specified", "n/a", "inferred", "none", "null", "assumed"
}


def slugify_ids(graph: Graph) -> Graph:
    """Ensure all node ids are lowercase slugs; update references in connections and facts."""
    id_map: dict[str, str] = {}

    new_nodes = []
    for n in graph.nodes:
        new_id = _slugify(n.id)
        if new_id != n.id:
            id_map[n.id] = new_id
            logger.debug(f"Slugified node id: {n.id!r} -> {new_id!r}")
        new_nodes.append(n.model_copy(update={"id": new_id}))
    graph = graph.model_copy(update={"nodes": new_nodes})

    new_conns = []
    for c in graph.connections:
        src = id_map.get(c.source, c.source)
        tgt = id_map.get(c.target, c.target)
        new_conns.append(c.model_copy(update={"source": src, "target": tgt}))
    graph = graph.model_copy(update={"connections": new_conns})

    new_facts = []
    for f in graph.facts:
        sid = id_map.get(f.subject_id, f.subject_id)
        new_facts.append(f.model_copy(update={"subject_id": sid}))
    graph = graph.model_copy(update={"facts": new_facts})

    return graph


def dedupe_nodes(graph: Graph) -> Graph:
    """Remove duplicate node ids, keeping the first occurrence."""
    seen: set[str] = set()
    unique = []
    for n in graph.nodes:
        if n.id not in seen:
            seen.add(n.id)
            unique.append(n)
        else:
            logger.warning(f"Dropping duplicate node id: {n.id!r}")
    return graph.model_copy(update={"nodes": unique})


def drop_dangling_connections(graph: Graph) -> Graph:
    """Remove connections referencing missing node ids."""
    valid_ids = {n.id for n in graph.nodes}
    good, bad = [], []
    for c in graph.connections:
        if c.source in valid_ids and c.target in valid_ids:
            good.append(c)
        else:
            bad.append(c)
            logger.warning(f"Dropping dangling connection {c.id!r}: {c.source!r} -> {c.target!r}")
    return graph.model_copy(update={"connections": good})


def assign_icon_keys(graph: Graph) -> Graph:
    """Assign icon_key to every node that is missing or has an invalid one."""
    new_nodes = []
    for n in graph.nodes:
        icon_key = n.icon_key
        if not icon_key or icon_key not in ICON_REGISTRY:
            icon_key = assign_icon_key(n.type.value, n.label)
        new_nodes.append(n.model_copy(update={"icon_key": icon_key}))
    return graph.model_copy(update={"nodes": new_nodes})


def reject_unsourced(graph: Graph) -> Graph:
    """Drop any 'stated' item whose locator is empty or generic."""
    def _locator_ok(provenance) -> bool:
        if provenance.origin.value == "inferred":
            return True
        locator = (provenance.source.locator or "").strip().lower()
        return locator not in GENERIC_LOCATORS and len(locator) > 0

    good_nodes = []
    for n in graph.nodes:
        if _locator_ok(n.provenance):
            good_nodes.append(n)
        else:
            logger.warning(f"Dropping unsourced node: {n.id!r}")

    good_conns = []
    for c in graph.connections:
        if _locator_ok(c.provenance):
            good_conns.append(c)
        else:
            logger.warning(f"Dropping unsourced connection: {c.id!r}")

    good_facts = []
    for f in graph.facts:
        if _locator_ok(f.provenance):
            good_facts.append(f)
        else:
            logger.warning(f"Dropping unsourced fact: {f.id!r}")

    return graph.model_copy(update={"nodes": good_nodes, "connections": good_conns, "facts": good_facts})


def run_all(graph: Graph) -> Graph:
    """Run all normalization passes in order."""
    graph = slugify_ids(graph)
    graph = dedupe_nodes(graph)
    graph = drop_dangling_connections(graph)
    graph = assign_icon_keys(graph)
    graph = reject_unsourced(graph)
    return graph


def _slugify(s: str) -> str:
    """Convert a string to a lowercase slug."""
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = s.strip("_")
    return s or "node"
