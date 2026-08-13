"""Seed script: insert a session document built from tests/fixtures/payments.json directly into Mongo.

Usage: python -m app.scripts.seed_ref_session [--sid SID]
"""
import asyncio
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.db.client import get_database
from app.models.graph import Graph
from app.pipeline.bucket import bucket
from app.pipeline.scale_rules import apply_scale_rules
from app.pipeline.coverage import classify, policy


async def seed(sid: str = "sess_ref_payments"):
    fixture_path = Path(__file__).parent.parent.parent / "tests" / "fixtures" / "payments.json"
    with open(fixture_path) as f:
        graph_data = json.load(f)

    graph = Graph.model_validate(graph_data)
    bucketed_graph, buckets = bucket(graph)
    band, scale_decisions = apply_scale_rules(bucketed_graph.scale)
    bucketed_graph.scale.band = band

    layers_data = []
    for b in buckets:
        stated_facts = [f for f in bucketed_graph.facts if f.layer == b.id and f.provenance.origin.value == "stated"]
        inferred_facts = [f for f in bucketed_graph.facts if f.layer == b.id and f.provenance.origin.value == "inferred"]
        cov = classify(len(b.node_ids), len(b.connection_ids), len(stated_facts))
        inf_state = policy(cov, session_mode="A", research_enabled=False)

        # UI ref narratives
        ref_narratives = {
            "data": {
                "kicker": "Layer 01 of 03 · Data",
                "title": "Where state lives",
                "body": "Every order write lands on a single Postgres primary. Logical replication publishes row-level changes to the stream, which fans them out to the warehouse. Nothing else writes to the primary.",
                "items": [
                    {"node_id": "pg", "title": "Postgres 16", "sub": "primary order store"},
                    {"node_id": "cdc", "title": "Change Stream", "sub": "logical replication"},
                    {"node_id": "wh", "title": "Snowflake", "sub": "analytics warehouse"}
                ],
                "chat_seed": "The data layer has one authoritative writer. Postgres holds order state, the change stream carries committed rows downstream, and the warehouse is a read-only consumer."
            },
            "api": {
                "kicker": "Layer 02 of 03 · API",
                "title": "Service boundaries",
                "body": "One gateway fronts every request. It terminates auth and rate limits before handing off to Ledger, which writes double-entry records and settles against Stripe. Ledger is the only service holding write credentials for Postgres.",
                "items": [
                    {"node_id": "gw", "title": "Edge Gateway", "sub": "auth + rate limits"},
                    {"node_id": "ledger", "title": "Ledger API", "sub": "double-entry writes"},
                    {"node_id": "stripe", "title": "Stripe", "sub": "payments provider"}
                ],
                "chat_seed": "The gateway is the only public surface. Ledger serialises writes and owns the Postgres connection pool. Settlement calls to Stripe are idempotent and retried out-of-band."
            },
            "infra": {
                "kicker": "Layer 03 of 03 · Infra",
                "title": "What it runs on",
                "body": "Everything runs on one EKS cluster fronted by Fastly. Traces, metrics and logs ship to Grafana Cloud with thirty-day retention, and every pod pulls short-lived credentials rather than static env vars.",
                "items": [
                    {"node_id": "fastly", "title": "Fastly Edge", "sub": "TLS, cache, WAF"},
                    {"node_id": "eks", "title": "EKS us-east-1", "sub": "12 nodes, 3 AZs"},
                    {"node_id": "obs", "title": "Grafana Cloud", "sub": "metrics, traces, logs"}
                ],
                "chat_seed": "One region, three availability zones. Fastly absorbs TLS and caching before traffic reaches the cluster. The gateway is the only workload with an ingress route."
            }
        }

        narr = ref_narratives.get(b.id, {})
        narr["fact_ids"] = b.fact_ids
        narr["model"] = "gpt-4o-mini"
        narr["generated_at"] = datetime.now(timezone.utc).isoformat()
        narr["regenerated_count"] = 0

        layers_data.append({
            "index": b.index,
            "id": b.id,
            "name": b.name,
            "band_label": b.band_label,
            "node_ids": b.node_ids,
            "connection_ids": b.connection_ids,
            "fact_ids": b.fact_ids,
            "coverage": {
                "node_count": len(b.node_ids),
                "connection_count": len(b.connection_ids),
                "stated_fact_count": len(stated_facts),
                "inferred_fact_count": len(inferred_facts),
                "level": cov.value,
            },
            "info_state": inf_state.value,
            "insufficient_reason": None,
            "scale_decisions": [
                {
                    "rule_id": d.rule_id,
                    "concern": d.concern,
                    "decision": d.decision,
                    "tradeoff_seed": d.tradeoff_seed,
                }
                for d in scale_decisions
            ],
            "narrative": narr,
        })

    now = datetime.now(timezone.utc).isoformat()
    session_doc = {
        "_id": sid,
        "schema_version": 1,
        "created_at": now,
        "updated_at": now,
        "title": "payments-platform",
        "subtitle": "architecture",
        "session_mode": "A",
        "status": "ready",
        "error": None,
        "source": {
            "files": [
                {
                    "file_id": "f_01",
                    "original_name": "payments-arch.pdf",
                    "mime": "application/pdf",
                    "kind": "pdf",
                    "stored_path": "uploads/sess_ref/f_01.pdf",
                    "bytes": 482113,
                    "page_count": 1,
                }
            ],
            "problem_statement": None,
        },
        "graph": bucketed_graph.model_dump(mode="json"),
        "layers": layers_data,
        "unlocked_index": 0,
        "active_index": 0,
        "layout": None,
        "chat": [],
        "exports": [],
        "pipeline_runs": [],
    }

    db = get_database()
    await db.sessions.replace_one({"_id": sid}, session_doc, upsert=True)
    print(f"Successfully seeded session {sid!r} into MongoDB!")


def main():
    parser = argparse.ArgumentParser(description="Seed reference session into Mongo")
    parser.add_argument("--sid", default="sess_ref_payments", help="Session ID")
    args = parser.parse_args()

    asyncio.run(seed(args.sid))


if __name__ == "__main__":
    main()
