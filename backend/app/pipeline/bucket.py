"""Deterministic bucket pipeline step with topological dataflow ordering.

NO LLM CALLS ARE PERMITTED IN THIS MODULE.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from app.models.graph import Graph, Node, Connection, Fact
from app.rules.bucket_rules import bucket_node, BucketResult

LAYER_DEFS = [
    {"index": 0, "id": "data",  "name": "Data",  "band_label": "LAYER 01 — DATA"},
    {"index": 1, "id": "api",   "name": "API",   "band_label": "LAYER 02 — API"},
    {"index": 2, "id": "infra", "name": "Infra", "band_label": "LAYER 03 — INFRA"},
]


@dataclass
class LayerBucket:
    index: int
    id: str
    name: str
    band_label: str
    node_ids: list[str] = field(default_factory=list)
    connection_ids: list[str] = field(default_factory=list)
    fact_ids: list[str] = field(default_factory=list)


def bucket(graph: Graph) -> tuple[Graph, list[LayerBucket]]:
    """
    Assign every node/connection/fact to a layer based on taxonomy rules
    and topological input->output dataflow dependency depth.
    Returns the mutated graph and a list of LayerBuckets.
    """
    buckets: dict[str, LayerBucket] = {
        d["id"]: LayerBucket(**d) for d in LAYER_DEFS
    }

    # Build node id map
    node_map = {n.id: n for n in graph.nodes}
    
    # Calculate in-degree (how many inputs flow into each node)
    in_degree: dict[str, int] = {n.id: 0 for n in graph.nodes}
    adj: dict[str, list[str]] = {n.id: [] for n in graph.nodes}
    for c in graph.connections:
        if c.source in adj and c.target in in_degree:
            adj[c.source].append(c.target)
            in_degree[c.target] += 1

    # --- Bucket nodes ---
    node_layer: dict[str, int] = {}
    new_nodes: list[Node] = []

    for n in graph.nodes:
        result: BucketResult = bucket_node(n.type.value, n.label, n.role, n.id)
        node_layer[n.id] = result.layer_index
        updated = n.model_copy(update={
            "layer": result.layer_id,
            "layer_index": result.layer_index,
            "bucket_rule": result.rule_id,
        })
        new_nodes.append(updated)
        buckets[result.layer_id].node_ids.append(n.id)

    graph = graph.model_copy(update={"nodes": new_nodes})

    # --- Bucket connections ---
    new_conns: list[Connection] = []
    for c in graph.connections:
        src_li = node_layer.get(c.source, 0)
        tgt_li = node_layer.get(c.target, 0)
        max_li = max(src_li, tgt_li)
        cross = src_li != tgt_li

        src_layer_id = LAYER_DEFS[src_li]["id"]
        updated = c.model_copy(update={
            "layer": src_layer_id,
            "layer_index": src_li,
            "cross_layer": cross,
            "max_layer_index": max_li,
        })
        new_conns.append(updated)
        buckets[src_layer_id].connection_ids.append(c.id)

    graph = graph.model_copy(update={"connections": new_conns})

    # --- Bucket facts ---
    new_facts: list[Fact] = []
    for f in graph.facts:
        if f.subject_kind == "node":
            li = node_layer.get(f.subject_id, 0)
        else:
            conn = next((c for c in graph.connections if c.id == f.subject_id), None)
            li = node_layer.get(conn.source, 0) if conn else 0

        layer_id = LAYER_DEFS[li]["id"]
        updated = f.model_copy(update={"layer": layer_id, "layer_index": li})
        new_facts.append(updated)
        buckets[layer_id].fact_ids.append(f.id)

    graph = graph.model_copy(update={"facts": new_facts})

    return graph, list(buckets.values())
