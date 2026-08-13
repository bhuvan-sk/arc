"""Tests for scale_rules.py — pure Python, no LLM."""
import pytest
from app.models.graph import ScaleProfile, ScaleNormalized, Provenance, Source
from app.pipeline.scale_rules import apply_scale_rules
from app.rules.scale_table import classify_band, get_decisions_for_band


def make_scale(dau: float | None = None, rps: float | None = None) -> ScaleProfile:
    return ScaleProfile(
        band=None,
        raw_mentions=[],
        normalized=ScaleNormalized(dau=dau, rps_peak=rps),
        provenance=Provenance(origin="stated", source=Source(kind="upload"), confidence=0.8)
    )


class TestScaleRules:
    def test_none_returns_unknown(self):
        band, decisions = apply_scale_rules(None)
        assert band == "unknown"
        assert len(decisions) == 0

    def test_empty_normalized_returns_unknown(self):
        scale = make_scale(dau=None, rps=None)
        band, decisions = apply_scale_rules(scale)
        assert band == "unknown"
        assert len(decisions) == 0

    def test_small_scale(self):
        scale = make_scale(dau=1000, rps=50)
        band, decisions = apply_scale_rules(scale)
        assert band == "small"
        assert len(decisions) > 0

    def test_medium_scale(self):
        scale = make_scale(dau=10000, rps=2000)
        band, decisions = apply_scale_rules(scale)
        assert band == "medium"
        assert len(decisions) > 0
        dec_texts = [d.decision for d in decisions]
        assert any("One synchronous standby" in t for t in dec_texts)

    def test_large_scale(self):
        scale = make_scale(dau=1000000, rps=20000)
        band, decisions = apply_scale_rules(scale)
        assert band == "large"
        assert len(decisions) > 0

    def test_hyper_scale(self):
        scale = make_scale(dau=50000000, rps=500000)
        band, decisions = apply_scale_rules(scale)
        assert band == "hyper"
        assert len(decisions) > 0
