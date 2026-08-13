"""Parse pipeline step — ingests files and extracts a structured Graph via LLM."""
import json
import logging
from pathlib import Path
from app.ingest.loader import IngestResult
from app.llm.client import llm_client
from app.llm.content import build_vision_parts, build_text_part
from app.llm.stages import PipelineStage
from app.models.graph import Graph
from app.pipeline.normalize import run_all

logger = logging.getLogger(__name__)

_SCHEMA_PATH = Path(__file__).parent.parent / "llm" / "schemas" / "parse_graph.schema.json"
_PROMPT_PATH = Path(__file__).parent.parent / "llm" / "prompts" / "parse_system.md"


def _load_schema() -> dict:
    with open(_SCHEMA_PATH) as f:
        return json.load(f)


def _load_prompt() -> str:
    return _PROMPT_PATH.read_text()


def parse(ingest_result: IngestResult) -> Graph:
    """Parse an IngestResult into a Graph via LLM structured output + normalization."""
    schema = _load_schema()
    system_prompt = _load_prompt()

    # Build content parts
    user_content = []
    if ingest_result.images:
        user_content.extend(build_vision_parts(ingest_result.images))
    for text in ingest_result.texts:
        user_content.append(build_text_part(text))

    if not user_content:
        # Empty input — return empty graph
        return Graph()

    # Add extraction instruction
    user_content.append(build_text_part(
        "Extract the complete architecture graph from the content above. "
        "Return only JSON conforming to the provided schema."
    ))

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    logger.info("Calling LLM for graph parse...")
    raw = llm_client.structured(
        stage=PipelineStage.PARSE,
        messages=messages,
        schema=schema,
        name="parse_graph",
    )

    # Remove internal usage key before model validation
    raw.pop("_usage", None)

    # Build and normalize graph
    graph = Graph.model_validate(raw)
    graph = run_all(graph)

    logger.info(f"Parsed graph: {len(graph.nodes)} nodes, {len(graph.connections)} connections, {len(graph.facts)} facts")
    return graph
