"""Gemini Live voice bridge: WS /api/sessions/{sid}/live.

Browser <-> this endpoint <-> Gemini Live (google-genai). The Gemini API key
never reaches the browser — audio is relayed server-side, same trust model as
every other LLM call in this app.

Wire protocol (JSON text frames both directions):

Browser -> server:
  {"type": "audio", "data": "<base64 pcm16 16kHz mono>"}
  {"type": "text",  "data": "<typed text turn>"}
  {"type": "stop"}

Server -> browser:
  {"type": "ready"}
  {"type": "audio", "data": "<base64 pcm16 24kHz mono>"}
  {"type": "input_transcript",  "text": "..."}   # what the user said (streamed)
  {"type": "output_transcript", "text": "..."}   # what the model is saying (streamed)
  {"type": "turn_complete"}
  {"type": "interrupted"}                          # user barge-in; flush playback
  {"type": "error", "message": "..."}
"""
from __future__ import annotations
import asyncio
import base64
import contextlib
import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types

from app.config import settings
from app.db.repository import repo
from app.pipeline.grounding import scoped_context
from app.pipeline.live_context import build_live_system_instruction

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sessions/{sid}/live", tags=["live"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _persist_voice_turn(
    sid: str, asked_layer_index: int, unlocked_index: int, user_text: str, model_text: str
) -> None:
    """Store a completed voice exchange in the same shape as text chat messages,
    so it renders in the existing chat feed and is included in export."""
    if user_text.strip():
        await repo.append_chat(sid, {
            "id": f"msg_{uuid.uuid4().hex[:6]}",
            "role": "user",
            "text": user_text.strip(),
            "created_at": _now_iso(),
            "layer_scope": list(range(unlocked_index + 1)),
            "asked_layer_index": asked_layer_index,
            "question_type": "other",
        })
    if model_text.strip():
        await repo.append_chat(sid, {
            "id": f"msg_{uuid.uuid4().hex[:6]}",
            "role": "assistant",
            "text": model_text.strip(),
            "created_at": _now_iso(),
            "layer_scope": list(range(unlocked_index + 1)),
            "asked_layer_index": asked_layer_index,
            "question_type": "other",
            "blocked": False,
            "block": None,
            # Voice answers aren't schema-validated JSON like text chat, so there's
            # no fact_ids breakdown — the grounding guarantee here is Gate 2 (the
            # system instruction never contained locked-layer tokens), not a
            # post-hoc check. See pipeline/live_context.py.
            "claims": [{"text": model_text.strip(), "tradeoff": "", "fact_ids": []}],
            "citations": [],
            "node_refs": [],
            "connection_refs": [],
            "trace_path": [],
            "model": settings.MODEL_LIVE,
        })


@router.websocket("")
async def live_voice(websocket: WebSocket, sid: str):
    await websocket.accept()

    session = await repo.get(sid)
    if not session:
        await websocket.send_json({"type": "error", "message": f"Session {sid} not found"})
        await websocket.close(code=4404)
        return

    if not settings.GEMINI_API_KEY:
        await websocket.send_json({
            "type": "error",
            "message": "GEMINI_API_KEY is not configured on the server. "
                       "Set it in backend/.env to enable Gemini Live voice.",
        })
        await websocket.close(code=4401)
        return

    unlocked_index = session.get("unlocked_index", 0)
    asked_layer_index = session.get("active_index", unlocked_index)
    scoped = scoped_context(session, unlocked_index)
    system_instruction = build_live_system_instruction(session, scoped)

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    live_config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        system_instruction=system_instruction,
        input_audio_transcription={},
        output_audio_transcription={},
    )

    try:
        async with client.aio.live.connect(model=settings.MODEL_LIVE, config=live_config) as gsession:
            await websocket.send_json({"type": "ready"})

            turn_user_text: list[str] = []
            turn_model_text: list[str] = []

            async def browser_to_gemini() -> None:
                while True:
                    raw = await websocket.receive_text()
                    msg = json.loads(raw)
                    mtype = msg.get("type")
                    if mtype == "audio":
                        pcm = base64.b64decode(msg["data"])
                        await gsession.send_realtime_input(
                            audio=types.Blob(data=pcm, mime_type="audio/pcm;rate=16000")
                        )
                    elif mtype == "text":
                        await gsession.send_realtime_input(text=msg.get("data", ""))
                    elif mtype == "stop":
                        return

            async def gemini_to_browser() -> None:
                async for response in gsession.receive():
                    content = response.server_content
                    if content is None:
                        continue

                    if content.interrupted:
                        await websocket.send_json({"type": "interrupted"})
                        turn_model_text.clear()

                    if content.model_turn:
                        for part in content.model_turn.parts:
                            if part.inline_data and part.inline_data.data:
                                b64 = base64.b64encode(part.inline_data.data).decode("ascii")
                                await websocket.send_json({"type": "audio", "data": b64})

                    if content.input_transcription and content.input_transcription.text:
                        turn_user_text.append(content.input_transcription.text)
                        await websocket.send_json({
                            "type": "input_transcript",
                            "text": content.input_transcription.text,
                        })

                    if content.output_transcription and content.output_transcription.text:
                        turn_model_text.append(content.output_transcription.text)
                        await websocket.send_json({
                            "type": "output_transcript",
                            "text": content.output_transcription.text,
                        })

                    if content.turn_complete:
                        await websocket.send_json({"type": "turn_complete"})
                        await _persist_voice_turn(
                            sid, asked_layer_index, unlocked_index,
                            "".join(turn_user_text), "".join(turn_model_text),
                        )
                        turn_user_text.clear()
                        turn_model_text.clear()

            # Run both directions concurrently; whichever ends first (browser
            # disconnect, or Gemini closing the stream) tears down the other,
            # otherwise the surviving task would await forever.
            up = asyncio.create_task(browser_to_gemini())
            down = asyncio.create_task(gemini_to_browser())
            done, pending = await asyncio.wait({up, down}, return_when=asyncio.FIRST_COMPLETED)
            for task in pending:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await task
            for task in done:
                exc = task.exception()
                if exc and not isinstance(exc, WebSocketDisconnect):
                    raise exc

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.exception("Gemini Live session error for session %s", sid)
        with contextlib.suppress(Exception):
            await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        with contextlib.suppress(Exception):
            await websocket.close()
