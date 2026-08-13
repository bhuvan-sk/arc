"""Pydantic model for the full MongoDB Session document (collection `sessions`)."""
from typing import Optional, Any
from pydantic import BaseModel, Field
from app.models.graph import Graph
from app.models.enums import InfoState, CoverageLevel, QuestionType


class SourceFile(BaseModel):
    file_id: str
    original_name: str
    mime: str
    kind: str  # image | pdf | docx | text | md
    stored_path: str
    bytes: int
    page_count: Optional[int] = None
    rasterized_pages: list[str] = []
    extracted_text: Optional[str] = None


class SessionSource(BaseModel):
    files: list[SourceFile] = []
    problem_statement: Optional[str] = None


class ScaleDecisionDoc(BaseModel):
    rule_id: str
    concern: str
    decision: str
    tradeoff_seed: str
    narration: Optional[str] = None
    provenance: Optional[dict[str, Any]] = None


class LayerNarrativeDoc(BaseModel):
    kicker: str
    title: str
    body: str
    items: list[dict[str, Any]] = []
    chat_seed: str
    fact_ids: list[str] = []
    model: str = "gpt-4o-mini"
    generated_at: str = ""
    regenerated_count: int = 0


class LayerCoverageDoc(BaseModel):
    node_count: int = 0
    connection_count: int = 0
    stated_fact_count: int = 0
    inferred_fact_count: int = 0
    level: str = "rich"  # rich | thin | empty


class LayerDoc(BaseModel):
    index: int
    id: str  # data | api | infra
    name: str  # Data | API | Infra
    band_label: str
    node_ids: list[str] = []
    connection_ids: list[str] = []
    fact_ids: list[str] = []
    coverage: LayerCoverageDoc = Field(default_factory=LayerCoverageDoc)
    info_state: str = "stated"  # stated | mixed | inferred | insufficient
    insufficient_reason: Optional[str] = None
    scale_decisions: list[ScaleDecisionDoc] = []
    narrative: Optional[LayerNarrativeDoc] = None


class BlockInfo(BaseModel):
    reason: str
    locked_layer_index: int
    locked_layer_name: str
    matched_terms: list[str] = []
    hint: str


class ChatClaim(BaseModel):
    text: str
    tradeoff: str
    fact_ids: list[str] = []


class ChatCitation(BaseModel):
    fact_id: str
    origin: str
    source: dict[str, Any] = {}


class ChatMessageDoc(BaseModel):
    id: str
    role: str  # user | assistant
    text: str
    created_at: str
    layer_scope: list[int] = []
    asked_layer_index: int
    question_type: str = "other"
    blocked: bool = False
    block: Optional[BlockInfo] = None
    claims: list[ChatClaim] = []
    citations: list[ChatCitation] = []
    node_refs: list[str] = []
    connection_refs: list[str] = []
    trace_path: list[str] = []
    model: Optional[str] = None
    usage: Optional[dict[str, Any]] = None


class ExportRecordDoc(BaseModel):
    id: str
    format: str  # pdf | docx
    layers_covered: list[int] = []
    path: str
    bytes: int
    created_at: str
    status: str = "ready"  # ready | failed


class PipelineRunDoc(BaseModel):
    stage: str
    model: str
    started_at: str
    ended_at: str
    ok: bool
    error: Optional[str] = None
    usage: Optional[dict[str, Any]] = None


class SessionDoc(BaseModel):
    id: str = Field(alias="_id")
    schema_version: int = 1
    created_at: str
    updated_at: str
    title: str = "Untitled Architecture"
    subtitle: str = "architecture"
    session_mode: str = "A"  # "A" | "B"
    status: str = "ingesting"  # uploaded|ingesting|parsing|bucketing|narrating|ready|failed
    error: Optional[str] = None

    source: SessionSource = Field(default_factory=SessionSource)
    graph: Graph = Field(default_factory=Graph)
    layers: list[LayerDoc] = []

    unlocked_index: int = 0
    active_index: int = 0

    layout: Optional[dict[str, Any]] = None
    chat: list[ChatMessageDoc] = []
    exports: list[ExportRecordDoc] = []
    pipeline_runs: list[PipelineRunDoc] = []
