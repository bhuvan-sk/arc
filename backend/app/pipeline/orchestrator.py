"""Pipeline orchestrator: background processing for uploaded sessions."""
import logging
from starlette.concurrency import run_in_threadpool
from app.db.repository import repo
from app.ingest.loader import load
from app.models.enums import InfoState
from app.pipeline.parse import parse
from app.pipeline.bucket import bucket
from app.pipeline.scale_rules import apply_scale_rules
from app.pipeline.coverage import classify, policy
from app.pipeline.narrate import narrate

logger = logging.getLogger(__name__)


async def run_ingest_pipeline(session_id: str):
    """Background task executed when a new session is uploaded."""
    try:
        logger.info(f"Starting pipeline for session {session_id}")
        session_data = await repo.get(session_id)
        if not session_data:
            logger.error(f"Session {session_id} not found")
            return

        await repo.set_status(session_id, "ingesting")

        files = session_data.get("source", {}).get("files", [])
        if not files:
            await repo.set_status(session_id, "failed", error="No uploaded files found")
            return

        # 1. Load files
        await repo.set_status(session_id, "parsing")
        all_images = []
        all_texts = []
        for f in files:
            res = load(f["stored_path"], f["mime"])
            all_images.extend(res.images)
            all_texts.extend(res.texts)

        class CombinedIngest:
            images = all_images
            texts = all_texts

        # 2. Parse graph. run_in_threadpool: this is a Starlette BackgroundTask,
        # which still runs on the server's single shared event loop — Starlette
        # only auto-threads *synchronous* background functions, and this one is
        # `async def`. A blocking parse() call (25-60+s per the LLM call logs)
        # run directly here freezes every other concurrent request, including
        # unrelated users, for the full duration.
        parsed_graph = await run_in_threadpool(parse, CombinedIngest())

        # 3. Bucket into layers
        await repo.set_status(session_id, "bucketing")
        bucketed_graph, layer_buckets = bucket(parsed_graph)

        # 4. Scale rules
        band, scale_decisions = apply_scale_rules(bucketed_graph.scale)
        bucketed_graph.scale.band = band

        # 5. Build LayerDocs
        layers_data = []
        session_mode = session_data.get("session_mode", "A")

        for b in layer_buckets:
            stated_facts = [
                f for f in bucketed_graph.facts
                if f.layer == b.id and f.provenance.origin.value == "stated"
            ]
            inferred_facts = [
                f for f in bucketed_graph.facts
                if f.layer == b.id and f.provenance.origin.value == "inferred"
            ]
            cov = classify(len(b.node_ids), len(b.connection_ids), len(stated_facts))
            inf_state = policy(cov, session_mode=session_mode, research_enabled=False)

            layer_doc = {
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
                "narrative": None,
            }
            layers_data.append(layer_doc)

        # 6. Narrate layer 0 (lazily narrate others on unlock)
        await repo.set_status(session_id, "narrating")
        layer0 = layers_data[0]
        layer0_nodes = [n.model_dump(mode="json") for n in bucketed_graph.nodes if n.id in layer0["node_ids"]]
        layer0_conns = [c.model_dump(mode="json") for c in bucketed_graph.connections if c.id in layer0["connection_ids"]]
        layer0_facts = [f.model_dump(mode="json") for f in bucketed_graph.facts if f.id in layer0["fact_ids"]]

        n0 = await run_in_threadpool(
            narrate,
            layer_name=layer0["name"],
            layer_index=0,
            info_state=InfoState(layer0["info_state"]),
            nodes=layer0_nodes,
            connections=layer0_conns,
            facts=layer0_facts,
            scale_decisions=scale_decisions,
        )
        layer0["narrative"] = n0

        # Save to Mongo
        graph_dict = bucketed_graph.model_dump(mode="json")
        await repo.set_graph_and_layers(
            session_id=session_id,
            graph_data=graph_dict,
            layers_data=layers_data,
            title=bucketed_graph.nodes[0].label if bucketed_graph.nodes else "Architecture",
        )
        await repo.set_status(session_id, "ready")
        logger.info(f"Pipeline completed successfully for session {session_id}")

    except Exception as e:
        logger.error(f"Ingest pipeline failed for {session_id}: {e}", exc_info=True)
        await repo.set_status(session_id, "failed", error=str(e))
