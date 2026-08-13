export type NodeType = 'db' | 'svc' | 'queue' | 'infra' | 'ext';
export type Transport = 'sync' | 'async' | 'replication' | 'bidirectional';
export type Origin = 'stated' | 'inferred';
export type ViewMode = 'Document' | 'Both' | 'Canvas';

export interface Source {
  kind: 'upload' | 'web' | 'rules' | 'llm_inference';
  file_id?: string | null;
  locator?: string | null;
  url?: string | null;
  title?: string | null;
  retrieved_at?: string | null;
  rule_id?: string | null;
}

export interface Provenance {
  origin: Origin;
  source: Source;
  confidence: number;
}

export interface NodeData {
  id: string;
  label: string;
  subtitle?: string | null;
  type: NodeType;
  icon_key: string;
  role: string;
  layer?: string | null;
  layer_index?: number | null;
  bucket_rule?: string | null;
  aliases?: string[];
  provenance: Provenance;
}

export interface ConnectionData {
  id: string;
  source: string;
  target: string;
  transport: Transport;
  label?: string | null;
  protocol?: string | null;
  sequence?: number | null;
  metric?: string | null;
  layer?: string | null;
  layer_index?: number | null;
  cross_layer?: boolean | null;
  max_layer_index?: number | null;
  provenance: Provenance;
}

export interface FactData {
  id: string;
  subject_kind: 'node' | 'connection';
  subject_id: string;
  layer?: string | null;
  layer_index?: number | null;
  category: string;
  statement: string;
  tradeoff: string;
  ddia_axis: string;
  provenance: Provenance;
}

export interface GraphData {
  nodes: NodeData[];
  connections: ConnectionData[];
  facts: FactData[];
  scale?: {
    band?: string | null;
    raw_mentions?: string[];
    normalized?: {
      dau?: number | null;
      rps_peak?: number | null;
      data_volume_gb?: number | null;
      read_write_ratio?: number | null;
    };
  } | null;
}

export interface LayerNarrative {
  kicker: string;
  title: string;
  body: string;
  items: { node_id: string; title: string; sub: string }[];
  chat_seed: string;
  fact_ids?: string[];
  model?: string;
  generated_at?: string;
  regenerated_count?: number;
}

export interface LayerData {
  index: number;
  id: 'data' | 'api' | 'infra';
  name: string;
  band_label: string;
  node_ids: string[];
  connection_ids: string[];
  fact_ids: string[];
  coverage: {
    node_count: number;
    connection_count: number;
    stated_fact_count: number;
    inferred_fact_count: number;
    level: 'rich' | 'thin' | 'empty';
  };
  info_state: 'stated' | 'mixed' | 'inferred' | 'insufficient';
  insufficient_reason?: string | null;
  scale_decisions: {
    rule_id: string;
    concern: string;
    decision: string;
    tradeoff_seed: string;
  }[];
  narrative?: LayerNarrative | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  created_at: string;
  layer_scope?: number[];
  asked_layer_index?: number;
  question_type?: string;
  blocked?: boolean;
  block?: {
    reason: string;
    locked_layer_index: number;
    locked_layer_name: string;
    matched_terms: string[];
    hint: string;
  } | null;
  claims?: {
    text: string;
    tradeoff: string;
    fact_ids: string[];
  }[];
  citations?: {
    fact_id: string;
    origin: Origin;
    source: Source;
  }[];
  node_refs?: string[];
  connection_refs?: string[];
  trace_path?: string[];
}

export interface SessionData {
  _id: string;
  title: string;
  subtitle: string;
  session_mode: 'A' | 'B';
  status: 'uploaded' | 'ingesting' | 'parsing' | 'bucketing' | 'narrating' | 'ready' | 'failed';
  error?: string | null;
  graph: GraphData;
  layers: LayerData[];
  unlocked_index: number;
  active_index: number;
  layout?: {
    nodes?: Record<string, { x: number; y: number }>;
    band_y?: Record<string, number>;
    engine_version?: string;
  } | null;
  chat: ChatMessage[];
}

export interface SessionSummary {
  id: string;
  title: string;
  subtitle: string;
  session_mode: 'A' | 'B';
  status: SessionData['status'] | 'unknown';
  error?: string | null;
  created_at: string;
  updated_at: string;
  unlocked_index: number;
  node_count: number;
  layer_count: number;
}
