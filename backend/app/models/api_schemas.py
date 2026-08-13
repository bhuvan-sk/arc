"""FastAPI request and response DTO schemas."""
from typing import Optional, Any
from pydantic import BaseModel
from app.models.enums import QuestionType


class SessionCreateResponse(BaseModel):
    session_id: str
    status: str


class SessionStatusResponse(BaseModel):
    status: str
    stage: Optional[str] = None
    progress: float = 0.0
    error: Optional[str] = None


class SessionSummary(BaseModel):
    id: str
    title: str
    subtitle: str = ""
    session_mode: str = "A"
    status: str
    error: Optional[str] = None
    created_at: str
    updated_at: str
    unlocked_index: int = 0
    node_count: int = 0
    layer_count: int = 0


class SessionListResponse(BaseModel):
    sessions: list[SessionSummary]


class LayerNextResponse(BaseModel):
    unlocked_index: int
    active_index: int
    layer: dict[str, Any]


class LayerActivateResponse(BaseModel):
    active_index: int


class LayerRegenerateRequest(BaseModel):
    hint: Optional[str] = None


class LayerRegenerateResponse(BaseModel):
    layer: dict[str, Any]


class ChatRequest(BaseModel):
    question: str
    asked_layer_index: int


class ChatResponse(BaseModel):
    message: dict[str, Any]
    unlocked_index: int


class LayoutUpdateRequest(BaseModel):
    nodes: dict[str, Any]
    band_y: dict[str, float]
    engine_version: str = "0.9.3"


class ExportRequest(BaseModel):
    format: str = "pdf"  # "pdf" | "docx"
    layers: Optional[list[int]] = None
    svg_by_layer: Optional[dict[str, str]] = None


class ExportResponse(BaseModel):
    export_id: str
    status: str
