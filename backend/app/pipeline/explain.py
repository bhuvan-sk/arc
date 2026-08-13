"""Explain pipeline step — answer a question grounded in scoped graph context."""
import json
import logging
from pathlib import Path
from app.llm.client import llm_client
from app.llm.content import build_text_part
from app.llm.stages import PipelineStage
from app.pipeline.grounding import ScopedContext, assert_grounded, GroundingError

logger = logging.getLogger(__name__)

_SCHEMA_PATH = Path(__file__).parent.parent / "llm" / "schemas" / "answer.schema.json"
_PROMPT_PATH = Path(__file__).parent.parent / "llm" / "prompts" / "explain_system.md"

SAFE_FALLBACK = (
    "I can only answer from the layers revealed so far, and nothing there covers that. "
    "Unlock the next layer to see if it contains the information you need."
)


def _load_schema() -> dict:
    with open(_SCHEMA_PATH) as f:
        return json.load(f)


def _load_prompt() -> str:
    return _PROMPT_PATH.read_text()


def _build_context_text(scoped: ScopedContext) -> str:
    """Serialize the scoped context into a structured text block for the prompt."""
    lines = ["## Available Graph Context\n"]

    lines.append("### Nodes")
    for n in scoped.nodes:
        lines.append(f"- [{n['id']}] {n.get('label', n['id'])} ({n.get('type','?')}): {n.get('subtitle','')}")

    lines.append("\n### Connections")
    for c in scoped.connections:
        lines.append(f"- [{c['id']}] {c['source']} -> {c['target']} ({c.get('transport','?')}): {c.get('label','')}")

    lines.append("\n### Facts")
    for f in scoped.facts:
        lines.append(f"- [{f['id']}] {f.get('statement','')} | Tradeoff: {f.get('tradeoff','')}")

    return "\n".join(lines)


def answer(
    question: str,
    scoped: ScopedContext,
    question_type: str = "other",
    max_retries: int = 2,
) -> dict:
    """
    Answer a question grounded in the scoped context.
    On GroundingError: retry once with corrective message.
    On second failure: return safe fallback.
    """
    schema = _load_schema()
    system_prompt = _load_prompt()
    context_text = _build_context_text(scoped)

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                build_text_part(context_text),
                build_text_part(f"Question: {question}\n\nProvide a grounded answer using ONLY the context above.")
            ]
        }
    ]

    last_answer = None
    for attempt in range(max_retries):
        try:
            raw = llm_client.structured(
                stage=PipelineStage.EXPLAIN,
                messages=messages,
                schema=schema,
                name="answer",
            )
            usage = raw.pop("_usage", {})
            assert_grounded(raw, scoped)
            raw["_usage"] = usage
            return raw
        except GroundingError as ge:
            last_answer = raw
            logger.warning(f"Grounding check failed on attempt {attempt+1}: {ge}")
            if attempt < max_retries - 1:
                # Add corrective message
                valid_fact_ids = list(scoped.fact_ids)[:20]
                valid_node_ids = list(scoped.node_ids)[:20]
                valid_conn_ids = list(scoped.connection_ids)[:20]
                corrective = (
                    f"Your previous answer referenced out-of-scope ids. "
                    f"Valid fact_ids: {valid_fact_ids}. "
                    f"Valid node ids: {valid_node_ids}. "
                    f"Valid connection ids: {valid_conn_ids}. "
                    "Retry with only these ids."
                )
                messages.append({"role": "assistant", "content": json.dumps(last_answer)})
                messages.append({"role": "user", "content": corrective})
        except Exception as e:
            logger.error(f"LLM explain call failed: {e}")
            break

    # Return safe fallback
    return {
        "claims": [{"text": SAFE_FALLBACK, "tradeoff": "", "fact_ids": []}],
        "node_refs": [],
        "connection_refs": [],
        "trace_path": [],
        "question_type": question_type,
        "_fallback": True,
    }
