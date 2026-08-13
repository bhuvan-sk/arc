"""Layer endpoints: /next, /{i}/activate, /{i}/regenerate, /{i}/research."""
from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool
from app.db.repository import repo
from app.api.deps import load_session_or_404
from app.api.errors import LayerLockedError, ResearchNotApplicableError
from app.models.api_schemas import (
    LayerNextResponse,
    LayerActivateResponse,
    LayerRegenerateRequest,
    LayerRegenerateResponse,
)
from app.models.enums import InfoState
from app.pipeline.scale_rules import apply_scale_rules
from app.pipeline.narrate import narrate

router = APIRouter(prefix="/api/sessions/{sid}/layers", tags=["layers"])


@router.post("/next", response_model=LayerNextResponse)
async def next_layer(sid: str):
    session = await load_session_or_404(sid)
    unlocked = session.get("unlocked_index", 0)
    layers = session.get("layers", [])

    new_unlocked = min(unlocked + 1, len(layers) - 1) if layers else 0
    new_active = new_unlocked

    # Lazily generate narrative for the newly unlocked layer if not already generated
    if new_unlocked < len(layers):
        target_layer = layers[new_unlocked]
        if not target_layer.get("narrative"):
            graph = session.get("graph", {})
            nodes = [n for n in graph.get("nodes", []) if n.get("id") in target_layer.get("node_ids", [])]
            conns = [c for c in graph.get("connections", []) if c.get("id") in target_layer.get("connection_ids", [])]
            facts = [f for f in graph.get("facts", []) if f.get("id") in target_layer.get("fact_ids", [])]

            _, scale_decisions = apply_scale_rules(None)  # read scale decisions from session if present

            # run_in_threadpool: narrate() makes a blocking OpenAI call. This is
            # an `async def` handler running on the single shared event loop —
            # calling a blocking function directly here would freeze every other
            # concurrent request (including unrelated ones like /api/health)
            # until it returns.
            narr_doc = await run_in_threadpool(
                narrate,
                layer_name=target_layer.get("name", ""),
                layer_index=new_unlocked,
                info_state=InfoState(target_layer.get("info_state", "stated")),
                nodes=nodes,
                connections=conns,
                facts=facts,
                scale_decisions=scale_decisions,
            )
            target_layer["narrative"] = narr_doc
            await repo.set_layer(sid, new_unlocked, target_layer)

    await repo.set_unlocked(sid, new_unlocked)
    await repo.set_active(sid, new_active)

    res_layer = layers[new_active] if layers else {}
    return LayerNextResponse(
        unlocked_index=new_unlocked,
        active_index=new_active,
        layer=res_layer,
    )


@router.post("/{layer_index}/activate", response_model=LayerActivateResponse)
async def activate_layer(sid: str, layer_index: int):
    session = await load_session_or_404(sid)
    unlocked = session.get("unlocked_index", 0)

    if layer_index > unlocked:
        raise LayerLockedError(
            f"Layer {layer_index} is locked",
            detail=f"Currently unlocked up to layer {unlocked}",
        )

    await repo.set_active(sid, layer_index)
    return LayerActivateResponse(active_index=layer_index)


@router.post("/{layer_index}/regenerate", response_model=LayerRegenerateResponse)
async def regenerate_layer(sid: str, layer_index: int, body: LayerRegenerateRequest | None = None):
    session = await load_session_or_404(sid)
    unlocked = session.get("unlocked_index", 0)
    layers = session.get("layers", [])

    if layer_index > unlocked:
        raise LayerLockedError(f"Layer {layer_index} is locked")

    if layer_index >= len(layers):
        raise LayerLockedError(f"Layer index {layer_index} out of range")

    target_layer = layers[layer_index]
    graph = session.get("graph", {})
    nodes = [n for n in graph.get("nodes", []) if n.get("id") in target_layer.get("node_ids", [])]
    conns = [c for c in graph.get("connections", []) if c.get("id") in target_layer.get("connection_ids", [])]
    facts = [f for f in graph.get("facts", []) if f.get("id") in target_layer.get("fact_ids", [])]

    narr_doc = await run_in_threadpool(
        narrate,
        layer_name=target_layer.get("name", ""),
        layer_index=layer_index,
        info_state=InfoState(target_layer.get("info_state", "stated")),
        nodes=nodes,
        connections=conns,
        facts=facts,
        scale_decisions=[],
    )
    narr_doc["regenerated_count"] = target_layer.get("narrative", {}).get("regenerated_count", 0) + 1
    target_layer["narrative"] = narr_doc

    await repo.set_layer(sid, layer_index, target_layer)
    return LayerRegenerateResponse(layer=target_layer)


@router.post("/{layer_index}/research")
async def research_layer(sid: str, layer_index: int):
    session = await load_session_or_404(sid)
    layers = session.get("layers", [])
    if layer_index >= len(layers):
        raise ResearchNotApplicableError("Invalid layer index")

    target_layer = layers[layer_index]
    info_state = target_layer.get("info_state")
    cov_level = target_layer.get("coverage", {}).get("level")

    if info_state not in {"insufficient", "mixed"} and cov_level not in {"empty", "thin"}:
        raise ResearchNotApplicableError("Research is only applicable when layer information is insufficient or thin")

    # In Phase 1-5, returns a mock addition for research
    return {"layer": target_layer, "added": {"nodes": [], "connections": [], "facts": []}}
