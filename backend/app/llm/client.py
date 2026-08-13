"""LLM client — wraps OpenAI SDK with structured output, retry/backoff, and usage capture."""
import json
import time
import logging
import os
from datetime import datetime, timezone
from typing import Any
from openai import OpenAI
from app.models.enums import PipelineStage
from app.llm.stages import model_for, temperature_for
from app.config import settings

logger = logging.getLogger(__name__)

# ── LLM call log file ─────────────────────────────────────────────────────────
_LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
os.makedirs(_LOG_DIR, exist_ok=True)
_LLM_LOG_PATH = os.path.join(_LOG_DIR, "llm_calls.log")


def _log_llm(event: str, **kwargs: Any) -> None:
    """Append one JSON line to logs/llm_calls.log."""
    record = {"ts": datetime.now(timezone.utc).isoformat(), "event": event, **kwargs}
    try:
        with open(_LLM_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception:
        pass  # never crash the pipeline over logging


class LLMClient:
    def __init__(self):
        self._client: OpenAI | None = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            # Explicit timeout is load-bearing, not just good practice: this
            # client is called synchronously from inside `async def` FastAPI
            # route handlers (see routes_layers.py, routes_chat.py). On a
            # single-process uvicorn server that blocks the *entire* event
            # loop for every concurrent user until the call returns — an
            # unbounded/hung upstream request doesn't just fail one request,
            # it freezes the whole backend (confirmed: a stuck narrate() call
            # took /api/health down with it). This bounds the worst case;
            # run_in_threadpool at the call sites (see route handlers) is what
            # stops it from blocking other requests while it waits.
            # max_retries=0 at the SDK level: our own structured()/text()/
            # with_web_search() already retry with backoff, so we don't want
            # two overlapping retry policies compounding worst-case latency.
            kwargs = {"api_key": settings.OPENAI_API_KEY, "timeout": 90.0, "max_retries": 0}
            if settings.OPENAI_BASE_URL and settings.OPENAI_BASE_URL.strip():
                kwargs["base_url"] = settings.OPENAI_BASE_URL.strip()
            self._client = OpenAI(**kwargs)
        return self._client

    def structured(
        self,
        stage: PipelineStage,
        messages: list[dict[str, Any]],
        schema: dict[str, Any],
        name: str,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """Call OpenAI with JSON schema structured output. Returns parsed dict."""
        client = self._get_client()
        model = model_for(stage)
        temperature = temperature_for(stage)

        t0 = time.time()
        _log_llm("structured.request", stage=stage.value, model=model, schema_name=name,
                 n_messages=len(messages), attempt=0)
        last_error = None
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": name,
                            "strict": True,
                            "schema": schema,
                        }
                    },
                    messages=messages,
                )
                content = response.choices[0].message.content
                usage = response.usage
                result = json.loads(content)
                result["_usage"] = {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "model": model,
                }
                _log_llm("structured.ok", stage=stage.value, model=model, schema_name=name,
                         prompt_tokens=usage.prompt_tokens, completion_tokens=usage.completion_tokens,
                         elapsed_s=round(time.time() - t0, 2))
                return result
            except Exception as e:
                last_error = e
                logger.warning(f"LLM structured call attempt {attempt+1} failed: {e}")
                _log_llm("structured.error", stage=stage.value, model=model, schema_name=name,
                         attempt=attempt + 1, error=str(e))
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
        raise RuntimeError(f"LLM structured call failed after {max_retries} attempts: {last_error}")

    def text(
        self,
        stage: PipelineStage,
        messages: list[dict[str, Any]],
        max_retries: int = 3,
    ) -> tuple[str, dict[str, Any]]:
        """Call OpenAI for plain text output. Returns (text, usage_dict)."""
        client = self._get_client()
        model = model_for(stage)
        temperature = temperature_for(stage)

        t0 = time.time()
        _log_llm("text.request", stage=stage.value, model=model, n_messages=len(messages))
        last_error = None
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    messages=messages,
                )
                text = response.choices[0].message.content or ""
                usage = response.usage
                _log_llm("text.ok", stage=stage.value, model=model,
                         prompt_tokens=usage.prompt_tokens, completion_tokens=usage.completion_tokens,
                         elapsed_s=round(time.time() - t0, 2))
                return text, {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "model": model,
                }
            except Exception as e:
                last_error = e
                logger.warning(f"LLM text call attempt {attempt+1} failed: {e}")
                _log_llm("text.error", stage=stage.value, model=model, attempt=attempt + 1, error=str(e))
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
        raise RuntimeError(f"LLM text call failed after {max_retries} attempts: {last_error}")

    def with_web_search(
        self,
        stage: PipelineStage,
        messages: list[dict[str, Any]],
        schema: dict[str, Any],
        name: str,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """Call OpenAI Responses API with web_search_preview tool (Mode B)."""
        client = self._get_client()
        model = model_for(stage)

        t0 = time.time()
        _log_llm("web_search.request", stage=stage.value, model=model)
        last_error = None
        for attempt in range(max_retries):
            try:
                response = client.responses.create(
                    model=model,
                    tools=[{"type": "web_search_preview"}],
                    input=messages[-1].get("content", ""),
                )
                # Extract text output
                text = ""
                for item in response.output:
                    if hasattr(item, "content"):
                        for c in item.content:
                            if hasattr(c, "text"):
                                text += c.text
                _log_llm("web_search.ok", stage=stage.value, model=model,
                         elapsed_s=round(time.time() - t0, 2))
                return {"text": text, "_usage": {}}
            except Exception as e:
                last_error = e
                logger.warning(f"LLM web_search call attempt {attempt+1} failed: {e}")
                _log_llm("web_search.error", stage=stage.value, model=model, attempt=attempt + 1, error=str(e))
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
        raise RuntimeError(f"LLM web_search call failed after {max_retries} attempts: {last_error}")


llm_client = LLMClient()
