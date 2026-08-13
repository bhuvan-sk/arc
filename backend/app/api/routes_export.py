"""Export endpoints: POST /api/sessions/{sid}/export, GET /api/sessions/{sid}/exports/{eid}."""
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import FileResponse
from app.config import settings
from app.db.repository import repo
from app.api.deps import load_session_or_404
from app.api.errors import ExportNotReadyError
from app.models.api_schemas import ExportRequest, ExportResponse
from app.export.pdf_exporter import generate_pdf
from app.export.docx_exporter import generate_docx

router = APIRouter(prefix="/api/sessions/{sid}", tags=["export"])


@router.post("/export", response_model=ExportResponse)
async def create_export(sid: str, body: ExportRequest):
    session = await load_session_or_404(sid)
    export_id = f"exp_{uuid.uuid4().hex[:6]}"
    unlocked = session.get("unlocked_index", 0)
    layers_covered = body.layers or [i for i in range(unlocked + 1)]

    export_dir = os.path.join(settings.UPLOAD_DIR, sid, "exports")
    os.makedirs(export_dir, exist_ok=True)

    ext = "docx" if body.format == "docx" else "pdf"
    file_path = os.path.join(export_dir, f"{export_id}.{ext}")

    try:
        if body.format == "docx":
            file_bytes = generate_docx(session, file_path)
        else:
            file_bytes = generate_pdf(session, file_path, body.svg_by_layer)

        status_str = "ready"
    except Exception as e:
        status_str = "failed"
        file_bytes = 0

    record = {
        "id": export_id,
        "format": body.format,
        "layers_covered": layers_covered,
        "path": file_path,
        "bytes": file_bytes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": status_str,
    }

    await repo.append_export(sid, record)
    return ExportResponse(export_id=export_id, status=status_str)


@router.get("/exports/{eid}")
async def get_export_file(sid: str, eid: str):
    session = await load_session_or_404(sid)
    exports = session.get("exports", [])
    rec = next((e for e in exports if e.get("id") == eid), None)

    if not rec or rec.get("status") != "ready" or not rec.get("path") or not os.path.exists(rec["path"]):
        raise ExportNotReadyError(f"Export {eid} is not ready or file missing")

    media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if rec.get("format") == "docx" else "application/pdf"
    filename = f"architecture_report_{eid}.{rec.get('format', 'pdf')}"
    return FileResponse(rec["path"], media_type=media_type, filename=filename)
