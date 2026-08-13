"""Chat endpoints: POST /api/sessions/{sid}/chat, GET /api/sessions/{sid}/chat."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool
from app.db.repository import repo
from app.api.deps import load_session_or_404
from app.models.api_schemas import ChatRequest, ChatResponse
from app.pipeline.scope_guard import classify_scope
from app.pipeline.grounding import scoped_context
from app.pipeline.explain import answer

router = APIRouter(prefix="/api/sessions/{sid}/chat", tags=["chat"])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("", response_model=ChatResponse)
async def send_chat_message(sid: str, body: ChatRequest):
    session = await load_session_or_404(sid)
    unlocked = session.get("unlocked_index", 0)
    asked_index = body.asked_layer_index

    # --- Gate 1: server-derived scope check ---
    if asked_index > unlocked:
        layers = session.get("layers", [])
        locked_name = layers[asked_index]["name"] if asked_index < len(layers) else "Locked"
        block_msg = {
            "id": f"msg_{uuid.uuid4().hex[:6]}",
            "role": "assistant",
            "text": f"Layer 0{asked_index + 1} ({locked_name}) is locked.",
            "created_at": now_iso(),
            "layer_scope": [i for i in range(unlocked + 1)],
            "asked_layer_index": asked_index,
            "question_type": "other",
            "blocked": True,
            "block": {
                "reason": "gate_1_scope",
                "locked_layer_index": asked_index,
                "locked_layer_name": locked_name,
                "matched_terms": [],
                "hint": f"Advance to Layer 0{asked_index + 1} to unlock answers for this layer.",
            },
            "claims": [],
            "citations": [],
            "node_refs": [],
            "connection_refs": [],
            "trace_path": [],
        }
        await repo.append_chat(sid, block_msg)
        return ChatResponse(message=block_msg, unlocked_index=unlocked)

    # --- Gate 3: deterministic intent classifier ---
    block_guard = classify_scope(body.question, session)
    if block_guard.blocked:
        block_msg = {
            "id": f"msg_{uuid.uuid4().hex[:6]}",
            "role": "assistant",
            "text": block_guard.hint or "This question references a locked layer.",
            "created_at": now_iso(),
            "layer_scope": [i for i in range(unlocked + 1)],
            "asked_layer_index": asked_index,
            "question_type": "other",
            "blocked": True,
            "block": {
                "reason": "gate_3_lexicon",
                "locked_layer_index": block_guard.locked_layer_index,
                "locked_layer_name": block_guard.locked_layer_name,
                "matched_terms": block_guard.matched_terms or [],
                "hint": block_guard.hint or "",
            },
            "claims": [],
            "citations": [],
            "node_refs": [],
            "connection_refs": [],
            "trace_path": [],
        }
        # Save user message + blocked assistant turn
        user_msg = {
            "id": f"msg_{uuid.uuid4().hex[:6]}",
            "role": "user",
            "text": body.question,
            "created_at": now_iso(),
            "layer_scope": [i for i in range(unlocked + 1)],
            "asked_layer_index": asked_index,
        }
        await repo.append_chat(sid, user_msg)
        await repo.append_chat(sid, block_msg)
        return ChatResponse(message=block_msg, unlocked_index=unlocked)

    # --- Gate 2: retrieval boundary ---
    scoped = scoped_context(session, unlocked_index=unlocked)

    # Save user message
    user_msg_id = f"msg_{uuid.uuid4().hex[:6]}"
    user_msg = {
        "id": user_msg_id,
        "role": "user",
        "text": body.question,
        "created_at": now_iso(),
        "layer_scope": [i for i in range(unlocked + 1)],
        "asked_layer_index": asked_index,
    }
    await repo.append_chat(sid, user_msg)

    # Generate answer via explain.py. run_in_threadpool: same reasoning as
    # routes_layers.py — this makes a blocking OpenAI call and must not run
    # directly on the shared event loop.
    ans = await run_in_threadpool(answer, body.question, scoped)

    # Build citations from facts
    facts_by_id = {f["id"]: f for f in session.get("graph", {}).get("facts", [])}
    citations = []
    for claim in ans.get("claims", []):
        for fid in claim.get("fact_ids", []):
            if fid in facts_by_id:
                f_item = facts_by_id[fid]
                citations.append({
                    "fact_id": fid,
                    "origin": f_item.get("provenance", {}).get("origin", "stated"),
                    "source": f_item.get("provenance", {}).get("source", {}),
                })

    usage = ans.pop("_usage", {})
    assistant_msg = {
        "id": f"msg_{uuid.uuid4().hex[:6]}",
        "role": "assistant",
        "text": ans.get("claims", [{}])[0].get("text", "") if ans.get("claims") else "",
        "created_at": now_iso(),
        "layer_scope": [i for i in range(unlocked + 1)],
        "asked_layer_index": asked_index,
        "question_type": ans.get("question_type", "other"),
        "blocked": False,
        "block": None,
        "claims": ans.get("claims", []),
        "citations": citations,
        "node_refs": ans.get("node_refs", []),
        "connection_refs": ans.get("connection_refs", []),
        "trace_path": ans.get("trace_path", []),
        "model": usage.get("model", "gpt-4o-mini"),
        "usage": usage,
    }

    await repo.append_chat(sid, assistant_msg)
    return ChatResponse(message=assistant_msg, unlocked_index=unlocked)


@router.get("")
async def get_chat_history(sid: str):
    session = await load_session_or_404(sid)
    return {"messages": session.get("chat", [])}
