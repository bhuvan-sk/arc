"""Deterministic scale rules pipeline step.

NO LLM CALLS ARE PERMITTED IN THIS MODULE.
"""
from typing import Optional
from app.models.graph import ScaleProfile
from app.rules.scale_table import classify_band, get_decisions_for_band, ScaleDecision


def apply_scale_rules(scale: Optional[ScaleProfile]) -> tuple[str, list[ScaleDecision]]:
    """
    Classify scale band and return scale decisions.
    Returns ("unknown", []) when scale is None or contains no numbers.
    """
    if scale is None or scale.normalized is None:
        return "unknown", []

    dau = scale.normalized.dau
    rps_peak = scale.normalized.rps_peak

    band = classify_band(dau, rps_peak)
    decisions = get_decisions_for_band(band)

    return band, decisions
