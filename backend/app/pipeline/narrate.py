"""Layer narrative pipeline step."""
import json
import logging
from pathlib import Path
from app.llm.client import llm_client
from app.llm.content import build_text_part
from app.llm.stages import PipelineStage
from app.models.enums import InfoState
from app.pipeline.coverage import INSUFFICIENT_TEMPLATE
from app.rules.scale_table import ScaleDecision

logger = logging.getLogger(__name__)

_SCHEMA_PATH = Path(__file__).parent.parent / "llm" / "schemas" / "narrative.schema.json"
_PROMPT_PATH = Path(__file__).parent.parent / "llm" / "prompts" / "narrate_layer.md"


def _load_schema() -> dict:
    with open(_SCHEMA_PATH) as f:
        return json.load(f)


def _load_prompt() -> str:
    return _PROMPT_PATH.read_text()


def narrate(
    layer_name: str,
    layer_index: int,
    info_state: InfoState,
    nodes: list[dict],
    connections: list[dict],
    facts: list[dict],
    scale_decisions: list[ScaleDecision],
) -> dict:
    """
    Generate narrative for a layer.
    If info_state is INSUFFICIENT, returns hardcoded narrative without making ANY LLM call.
    """
    kicker = f"Layer 0{layer_index + 1} of 03 · {layer_name}"

    if info_state == InfoState.INSUFFICIENT:
        body = INSUFFICIENT_TEMPLATE.format(layer_name=layer_name)
        return {
            "kicker": kicker,
            "title": f"No {layer_name} Data Stated",
            "body": body,
            "items": [],
            "chat_seed": body,
            "fact_ids": [],
            "model": "none",
            "generated_at": "",
            "regenerated_count": 0,
        }

    # Normal LLM narration
    schema = _load_schema()
    prompt = _load_prompt()

    context_block = {
        "layer_name": layer_name,
        "layer_index": layer_index,
        "nodes": [{"id": n["id"], "title": n["label"], "sub": n.get("subtitle", "")} for n in nodes],
        "connections": [{"id": c["id"], "source": c["source"], "target": c["target"], "label": c.get("label")} for c in connections],
        "facts": [{"id": f["id"], "statement": f["statement"], "tradeoff": f["tradeoff"]} for f in facts],
        "scale_decisions": [{"concern": d.concern, "decision": d.decision} for d in scale_decisions],
    }

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": [build_text_part(json.dumps(context_block, indent=2))]}
    ]

    try:
        res = llm_client.structured(
            stage=PipelineStage.NARRATE,
            messages=messages,
            schema=schema,
            name="narrative"
        )
        model_used = res.pop("_usage", {}).get("model", "gpt-4o-mini")

        # Verify scale decisions inserted verbatim
        body_text = res.get("body", "")
        for dec in scale_decisions:
            if dec.decision not in body_text:
                body_text += f"\n\n{dec.decision}"
        res["body"] = body_text

        res["kicker"] = kicker
        res["fact_ids"] = [f["id"] for f in facts]
        res["model"] = model_used
        res["generated_at"] = ""
        res["regenerated_count"] = 0
        return res
    except Exception as e:
        logger.error(f"Failed to generate layer narrative: {e}")
        # Fallback narrative
        default_items = [{"node_id": n["id"], "title": n["label"], "sub": n.get("subtitle", "")} for n in nodes[:4]]
        return {
            "kicker": kicker,
            "title": f"{layer_name} Overview",
            "body": f"Overview of the {layer_name} layer containing {len(nodes)} components.",
            "items": default_items,
            "chat_seed": f"Scoped overview of the {layer_name} layer.",
            "fact_ids": [f["id"] for f in facts],
            "model": "fallback",
            "generated_at": "",
            "regenerated_count": 0,
        }
