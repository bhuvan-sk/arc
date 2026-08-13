"""Tests for coverage.py — pure Python, no LLM."""
import pytest
from app.models.enums import CoverageLevel, InfoState
from app.pipeline.coverage import classify, policy


class TestCoverageClassifier:
    def test_empty(self):
        assert classify(node_count=0, connection_count=0, stated_fact_count=0) == CoverageLevel.EMPTY

    def test_thin_no_facts(self):
        assert classify(node_count=3, connection_count=2, stated_fact_count=1) == CoverageLevel.THIN

    def test_thin_no_conns(self):
        assert classify(node_count=2, connection_count=0, stated_fact_count=4) == CoverageLevel.THIN

    def test_rich(self):
        assert classify(node_count=3, connection_count=2, stated_fact_count=4) == CoverageLevel.RICH


class TestCoveragePolicyTable:
    def test_rich_mode_a_stated(self):
        assert policy(CoverageLevel.RICH, session_mode="A", research_enabled=False) == InfoState.STATED

    def test_thin_mode_a_research_off_stated(self):
        assert policy(CoverageLevel.THIN, session_mode="A", research_enabled=False) == InfoState.STATED

    def test_thin_research_on_mixed(self):
        assert policy(CoverageLevel.THIN, session_mode="A", research_enabled=True) == InfoState.MIXED
        assert policy(CoverageLevel.THIN, session_mode="B", research_enabled=False) == InfoState.MIXED

    def test_empty_mode_a_research_off_insufficient(self):
        assert policy(CoverageLevel.EMPTY, session_mode="A", research_enabled=False) == InfoState.INSUFFICIENT

    def test_empty_research_on_inferred(self):
        assert policy(CoverageLevel.EMPTY, session_mode="A", research_enabled=True) == InfoState.INFERRED
        assert policy(CoverageLevel.EMPTY, session_mode="B", research_enabled=False) == InfoState.INFERRED
