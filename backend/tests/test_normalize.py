"""Tests for normalize.py — all pure Python, no LLM."""
import pytest
import json
from app.models.graph import Graph, Node, Connection, Fact, ScaleProfile, ScaleNormalized, Provenance, Source
from app.models.enums import NodeType, Transport, Origin
from app.pipeline.normalize import slugify_ids, dedupe_nodes, drop_dangling_connections, assign_icon_keys, reject_unsourced, run_all


def make_provenance(origin: str = "stated", locator: str = "page 1") -> Provenance:
    return Provenance(
        origin=Origin(origin),
        source=Source(kind="upload", file_id="f_01", locator=locator),
        confidence=0.9
    )


def make_node(id: str, node_type: str = "db", role: str = "persists",
              label: str | None = None, locator: str = "page 1") -> Node:
    return Node(
        id=id, label=label or id, type=NodeType(node_type),
        icon_key="db.relational", role=role,
        provenance=make_provenance("stated", locator)
    )


def make_connection(id: str, source: str, target: str) -> Connection:
    return Connection(
        id=id, source=source, target=target, transport=Transport.SYNC,
        provenance=make_provenance("stated", "page 1")
    )


class TestSluggifyIds:
    def test_converts_spaces_and_caps(self):
        graph = Graph(nodes=[make_node("Postgres 16")])
        result = slugify_ids(graph)
        assert result.nodes[0].id == "postgres_16"

    def test_updates_connection_references(self):
        graph = Graph(
            nodes=[make_node("Postgres 16"), make_node("Change Stream", "queue")],
            connections=[make_connection("e1", "Postgres 16", "Change Stream")]
        )
        result = slugify_ids(graph)
        assert result.connections[0].source == "postgres_16"
        assert result.connections[0].target == "change_stream"

    def test_already_slugged_unchanged(self):
        graph = Graph(nodes=[make_node("pg")])
        result = slugify_ids(graph)
        assert result.nodes[0].id == "pg"


class TestDedupeNodes:
    def test_drops_duplicate_ids(self):
        n1 = make_node("pg")
        n2 = make_node("pg")
        graph = Graph(nodes=[n1, n2])
        result = dedupe_nodes(graph)
        assert len(result.nodes) == 1

    def test_keeps_unique_ids(self):
        graph = Graph(nodes=[make_node("pg"), make_node("cdc", "queue")])
        result = dedupe_nodes(graph)
        assert len(result.nodes) == 2


class TestDropDanglingConnections:
    def test_drops_connection_with_missing_source(self):
        graph = Graph(
            nodes=[make_node("pg")],
            connections=[make_connection("e1", "missing", "pg")]
        )
        result = drop_dangling_connections(graph)
        assert len(result.connections) == 0

    def test_keeps_valid_connections(self):
        graph = Graph(
            nodes=[make_node("pg"), make_node("cdc", "queue")],
            connections=[make_connection("e1", "pg", "cdc")]
        )
        result = drop_dangling_connections(graph)
        assert len(result.connections) == 1


class TestAssignIconKeys:
    def test_assigns_icon_key_from_label(self):
        n = make_node("pg", label="Postgres 16")
        graph = Graph(nodes=[n])
        result = assign_icon_keys(graph)
        assert result.nodes[0].icon_key == "db.relational"

    def test_stripe_gets_payment_icon(self):
        n = Node(id="stripe", label="Stripe", type=NodeType.EXT, icon_key="", role="external",
                 provenance=make_provenance())
        graph = Graph(nodes=[n])
        result = assign_icon_keys(graph)
        assert result.nodes[0].icon_key == "ext.payment"

    def test_kafka_gets_stream_icon(self):
        n = Node(id="kafka", label="Kafka", type=NodeType.QUEUE, icon_key="", role="persists",
                 provenance=make_provenance())
        graph = Graph(nodes=[n])
        result = assign_icon_keys(graph)
        assert result.nodes[0].icon_key == "q.stream"


class TestRejectUnsourced:
    def test_drops_stated_with_empty_locator(self):
        n = make_node("pg", locator="")
        graph = Graph(nodes=[n])
        result = reject_unsourced(graph)
        assert len(result.nodes) == 0

    def test_keeps_inferred_with_empty_locator(self):
        n = Node(id="pg", label="pg", type=NodeType.DB, icon_key="db.relational", role="persists",
                 provenance=Provenance(origin=Origin.INFERRED, source=Source(kind="llm_inference", locator=""), confidence=0.6))
        graph = Graph(nodes=[n])
        result = reject_unsourced(graph)
        assert len(result.nodes) == 1

    def test_keeps_stated_with_good_locator(self):
        n = make_node("pg", locator="page 1, box labeled Postgres 16")
        graph = Graph(nodes=[n])
        result = reject_unsourced(graph)
        assert len(result.nodes) == 1


class TestRunAll:
    def test_no_layer_key_in_output(self):
        """Critical: parsed graph must never have a 'layer' key set from parse step."""
        graph = Graph(nodes=[make_node("pg")], connections=[], facts=[])
        result = run_all(graph)
        d = result.model_dump(mode="json")
        # layer/layer_index should be null (not set by parse)
        for node in d["nodes"]:
            assert node.get("layer") is None
            assert node.get("layer_index") is None

    def test_node_ids_are_unique_slugs(self):
        nodes = [make_node("Postgres 16"), make_node("change Stream", "queue")]
        graph = Graph(nodes=nodes)
        result = run_all(graph)
        ids = [n.id for n in result.nodes]
        assert len(ids) == len(set(ids))
        for id_ in ids:
            assert id_ == id_.lower()
            assert " " not in id_

    def test_all_icon_keys_valid(self):
        from app.rules.taxonomy import ICON_REGISTRY
        nodes = [make_node("pg", label="Postgres 16"), make_node("gw", "svc", label="Gateway", locator="page 1")]
        graph = Graph(nodes=nodes)
        result = run_all(graph)
        for node in result.nodes:
            assert node.icon_key in ICON_REGISTRY
