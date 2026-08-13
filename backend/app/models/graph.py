"""Pydantic models for the Graph sub-document."""
from typing import Optional
from pydantic import BaseModel
from app.models.enums import NodeType, Transport, Origin


class Source(BaseModel):
    kind: str  # upload | web | rules | llm_inference
    file_id: Optional[str] = None
    locator: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    retrieved_at: Optional[str] = None
    rule_id: Optional[str] = None


class Provenance(BaseModel):
    origin: Origin
    source: Source
    confidence: float


class Node(BaseModel):
    id: str
    label: str
    subtitle: Optional[str] = None
    type: NodeType
    icon_key: str
    role: str  # persists | serves | runs | external
    layer: Optional[str] = None         # written by bucket.py only
    layer_index: Optional[int] = None   # written by bucket.py only
    bucket_rule: Optional[str] = None   # written by bucket.py only
    aliases: list[str] = []
    provenance: Provenance


class Connection(BaseModel):
    id: str
    source: str
    target: str
    transport: Transport
    label: Optional[str] = None
    protocol: Optional[str] = None
    sequence: Optional[int] = None
    metric: Optional[str] = None
    layer: Optional[str] = None         # written by bucket.py only
    layer_index: Optional[int] = None   # written by bucket.py only
    cross_layer: Optional[bool] = None  # written by bucket.py only
    max_layer_index: Optional[int] = None  # written by bucket.py only
    provenance: Provenance


class Fact(BaseModel):
    id: str
    subject_kind: str  # node | connection
    subject_id: str
    layer: Optional[str] = None       # written by bucket.py only
    layer_index: Optional[int] = None  # written by bucket.py only
    category: str
    statement: str
    tradeoff: str
    ddia_axis: str
    provenance: Provenance


class ScaleNormalized(BaseModel):
    dau: Optional[float] = None
    rps_peak: Optional[float] = None
    data_volume_gb: Optional[float] = None
    read_write_ratio: Optional[float] = None


class ScaleProfile(BaseModel):
    band: Optional[str] = None          # written by scale_rules.py
    raw_mentions: list[str] = []
    normalized: ScaleNormalized = ScaleNormalized()
    provenance: Provenance


class Graph(BaseModel):
    nodes: list[Node] = []
    connections: list[Connection] = []
    facts: list[Fact] = []
    scale: Optional[ScaleProfile] = None
