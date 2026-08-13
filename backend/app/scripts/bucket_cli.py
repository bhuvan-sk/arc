"""CLI: run bucketing, coverage, and scale rules on a graph JSON.

Usage: python -m app.scripts.bucket_cli <graph.json>
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.models.graph import Graph
from app.pipeline.bucket import bucket
from app.pipeline.scale_rules import apply_scale_rules
from app.pipeline.coverage import classify, policy


def main():
    parser = argparse.ArgumentParser(description="Bucket a graph JSON into layers")
    parser.add_argument("graph_json", help="Path to graph JSON file")
    args = parser.parse_args()

    with open(args.graph_json) as f:
        data = json.load(f)

    graph = Graph.model_validate(data)
    bucketed_graph, buckets = bucket(graph)
    band, scale_decisions = apply_scale_rules(bucketed_graph.scale)

    print(f"Scale Band: {band} ({len(scale_decisions)} decisions)")
    print("-" * 50)

    for b in buckets:
        stated_facts = sum(
            1 for f in bucketed_graph.facts
            if f.layer == b.id and f.provenance.origin.value == "stated"
        )
        cov = classify(len(b.node_ids), len(b.connection_ids), stated_facts)
        inf = policy(cov, session_mode="A", research_enabled=False)
        print(f"Layer [{b.id.upper()}]: nodes={len(b.node_ids)} conns={len(b.connection_ids)} facts={len(b.fact_ids)} coverage={cov.value} info={inf.value}")


if __name__ == "__main__":
    main()
