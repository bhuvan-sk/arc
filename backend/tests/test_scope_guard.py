"""Tests for scope_guard.py — Gate 3 classifier."""
import pytest
from app.pipeline.scope_guard import classify_scope


def make_session(unlocked_index: int = 0) -> dict:
    return {
        "unlocked_index": unlocked_index,
        "layers": [
            {"index": 0, "id": "data", "name": "Data"},
            {"index": 1, "id": "api", "name": "API"},
            {"index": 2, "id": "infra", "name": "Infra"},
        ],
        "graph": {
            "nodes": [
                {"id": "pg", "label": "Postgres 16", "layer_index": 0, "aliases": ["orders db"]},
                {"id": "gw", "label": "Edge Gateway", "layer_index": 1, "aliases": ["gateway"]},
                {"id": "eks", "label": "EKS us-east-1", "layer_index": 2, "aliases": ["kubernetes", "k8s"]},
            ]
        }
    }


class TestScopeGuard:
    def test_unlocked_layer_not_blocked(self):
        session = make_session(unlocked_index=0)
        res = classify_scope("How does Postgres write data?", session)
        assert res.blocked is False

    def test_locked_infra_lexicon_blocked(self):
        session = make_session(unlocked_index=0)
        res = classify_scope("How does kubernetes autoscale pods?", session)
        assert res.blocked is True
        assert res.locked_layer_index == 2
        assert res.locked_layer_name == "Infra"

    def test_locked_node_label_blocked(self):
        session = make_session(unlocked_index=0)
        res = classify_scope("What does the Edge Gateway do?", session)
        assert res.blocked is True
        assert res.locked_layer_index == 1

    def test_unlocked_all_layers_not_blocked(self):
        session = make_session(unlocked_index=2)
        res = classify_scope("How does EKS host the Gateway?", session)
        assert res.blocked is False

    def test_ambiguous_overview_question_not_blocked(self):
        session = make_session(unlocked_index=0)
        res = classify_scope("How does the whole thing work overall?", session)
        assert res.blocked is False
