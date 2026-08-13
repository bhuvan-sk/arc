"""LLM content part builders."""
import base64
from typing import Any


def build_vision_parts(images: list[bytes]) -> list[dict[str, Any]]:
    """Convert raw PNG/JPEG bytes to OpenAI vision content parts (data-URL format)."""
    parts = []
    for img_bytes in images:
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        parts.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/png;base64,{b64}",
                "detail": "high"
            }
        })
    return parts


def build_text_part(text: str) -> dict[str, Any]:
    """Build a plain text content part."""
    return {"type": "text", "text": text}
