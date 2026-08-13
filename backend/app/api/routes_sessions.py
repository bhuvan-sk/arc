"""Session endpoints: POST /api/sessions, GET /api/sessions/{sid}, status, graph, layout."""
import os
import uuid
import mimetypes
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, status
from app.config import settings
from app.db.repository import repo
from app.models.session import SessionDoc, SessionSource, SourceFile
from app.models.api_schemas import (
    SessionCreateResponse, SessionStatusResponse, LayoutUpdateRequest,
    SessionSummary, SessionListResponse,
)
from app.api.deps import load_session_or_404
from app.pipeline.orchestrator import run_ingest_pipeline

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", status_code=status.HTTP_202_ACCEPTED, response_model=SessionCreateResponse)
async def create_session(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    mode: str = Form("A"),
    problem_statement: str | None = Form(None),
    title: str | None = Form(None),
):
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    sess_dir = os.path.join(settings.UPLOAD_DIR, session_id)
    os.makedirs(sess_dir, exist_ok=True)

    source_files = []
    for i, file in enumerate(files):
        file_id = f"f_{i+1:02d}"
        ext = file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "bin"
        stored_name = f"{file_id}.{ext}"
        stored_path = os.path.join(sess_dir, stored_name)

        content = await file.read()
        with open(stored_path, "wb") as f:
            f.write(content)

        mime = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
        kind = "image"
        if "pdf" in mime or ext == "pdf":
            kind = "pdf"
        elif "word" in mime or ext in {"docx", "doc"}:
            kind = "docx"
        elif "text" in mime or ext in {"txt", "md"}:
            kind = "text"

        source_files.append(
            SourceFile(
                file_id=file_id,
                original_name=file.filename or "file",
                mime=mime,
                kind=kind,
                stored_path=stored_path,
                bytes=len(content),
            )
        )

    now = datetime.now(timezone.utc).isoformat()
    session_doc = SessionDoc(
        _id=session_id,
        created_at=now,
        updated_at=now,
        title=title or (files[0].filename if files else "Untitled"),
        session_mode=mode,
        status="ingesting",
        source=SessionSource(files=source_files, problem_statement=problem_statement),
    )

    await repo.create(session_doc)

    # Launch background ingest pipeline
    background_tasks.add_task(run_ingest_pipeline, session_id)
    return SessionCreateResponse(session_id=session_id, status="ingesting")


@router.get("", response_model=SessionListResponse)
async def list_sessions():
    rows = await repo.list_sessions()
    return SessionListResponse(sessions=[
        SessionSummary(
            id=r["_id"],
            title=r.get("title") or "Untitled",
            subtitle=r.get("subtitle") or "",
            session_mode=r.get("session_mode", "A"),
            status=r.get("status", "unknown"),
            error=r.get("error"),
            created_at=r.get("created_at", ""),
            updated_at=r.get("updated_at", ""),
            unlocked_index=r.get("unlocked_index", 0),
            node_count=r.get("node_count", 0),
            layer_count=r.get("layer_count", 0),
        )
        for r in rows
    ])


@router.get("/{sid}")
async def get_session(sid: str):
    session = await load_session_or_404(sid)
    return session


@router.get("/{sid}/status", response_model=SessionStatusResponse)
async def get_session_status(sid: str):
    session = await load_session_or_404(sid)
    st = session.get("status", "ingesting")
    err = session.get("error")
    return SessionStatusResponse(status=st, stage=st, progress=1.0 if st == "ready" else 0.5, error=err)


@router.get("/{sid}/graph")
async def get_session_graph(sid: str):
    session = await load_session_or_404(sid)
    return session.get("graph", {})


@router.put("/{sid}/layout", status_code=status.HTTP_204_NO_CONTENT)
async def update_layout(sid: str, body: LayoutUpdateRequest):
    await load_session_or_404(sid)
    layout_data = body.model_dump(mode="json")
    await repo.set_layout(sid, layout_data)
