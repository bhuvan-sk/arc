"""Deterministic bucket rules: label/type → data/api/infra layer assignment.

NO LLM CALLS ARE PERMITTED IN THIS MODULE.
"""
from dataclasses import dataclass


@dataclass
class BucketResult:
    layer_id: str        # "data" | "api" | "infra"
    layer_index: int     # 0 | 1 | 2
    rule_id: str         # audit trail


# ─────────────────────────────────────────────────────────────────────────────
# Type map (first-pass): NodeType → default layer
# ─────────────────────────────────────────────────────────────────────────────
_TYPE_MAP: dict[str, str] = {
    "db": "data",
    "infra": "infra",
}

# ─────────────────────────────────────────────────────────────────────────────
# Keyword table: substring match on lowercased label → layer override
# Evaluated in order — first match wins.
# ─────────────────────────────────────────────────────────────────────────────
_KEYWORD_TABLE: list[tuple[str, str, str]] = [
    # Data keywords
    ("postgres", "data", "keyword.postgres->data"),
    ("mysql", "data", "keyword.mysql->data"),
    ("mongo", "data", "keyword.mongo->data"),
    ("dynamo", "data", "keyword.dynamo->data"),
    ("redis", "data", "keyword.redis->data"),
    ("snowflake", "data", "keyword.snowflake->data"),
    ("bigquery", "data", "keyword.bigquery->data"),
    ("redshift", "data", "keyword.redshift->data"),
    ("clickhouse", "data", "keyword.clickhouse->data"),
    ("warehouse", "data", "keyword.warehouse->data"),
    ("s3", "data", "keyword.s3->data"),
    ("object storage", "data", "keyword.object_storage->data"),
    ("cache", "data", "keyword.cache->data"),
    # CDN/infra keywords
    ("cloudfront", "infra", "keyword.cloudfront->infra"),
    ("fastly", "infra", "keyword.fastly->infra"),
    ("cloudflare", "infra", "keyword.cloudflare->infra"),
    ("akamai", "infra", "keyword.akamai->infra"),
    ("cdn", "infra", "keyword.cdn->infra"),
    ("load balancer", "infra", "keyword.load_balancer->infra"),
    ("alb", "infra", "keyword.alb->infra"),
    ("elb", "infra", "keyword.elb->infra"),
    ("eks", "infra", "keyword.eks->infra"),
    ("kubernetes", "infra", "keyword.kubernetes->infra"),
    ("k8s", "infra", "keyword.k8s->infra"),
    ("ecs", "infra", "keyword.ecs->infra"),
    ("lambda", "infra", "keyword.lambda->infra"),
    ("cloud run", "infra", "keyword.cloud_run->infra"),
    ("grafana", "infra", "keyword.grafana->infra"),
    ("datadog", "infra", "keyword.datadog->infra"),
    ("prometheus", "infra", "keyword.prometheus->infra"),
    ("terraform", "infra", "keyword.terraform->infra"),
    # API keywords
    ("gateway", "api", "keyword.gateway->api"),
    ("api gateway", "api", "keyword.api_gateway->api"),
    ("kong", "api", "keyword.kong->api"),
    ("nginx", "api", "keyword.nginx->api"),
    ("envoy", "api", "keyword.envoy->api"),
    ("auth", "api", "keyword.auth->api"),
]

_LAYER_INDEX: dict[str, int] = {"data": 0, "api": 1, "infra": 2}


def bucket_node(
    node_type: str,
    label: str,
    role: str,
    node_id: str = "",
) -> BucketResult:
    """
    Assign a node to a layer. Precedence:
    1. Keyword table match on label (first hit wins)
    2. Type map
    3. Role-based fallback
    """
    label_lower = label.lower()

    # 1. Keyword match
    for keyword, layer, rule_id in _KEYWORD_TABLE:
        if keyword in label_lower:
            return BucketResult(layer_id=layer, layer_index=_LAYER_INDEX[layer], rule_id=rule_id)

    # 2. Type map
    if node_type in _TYPE_MAP:
        layer = _TYPE_MAP[node_type]
        return BucketResult(layer_id=layer, layer_index=_LAYER_INDEX[layer],
                           rule_id=f"type_map.{node_type}->{layer}")

    # 3. Role-based for queue and svc/ext
    if node_type == "queue":
        if role == "persists":
            return BucketResult(layer_id="data", layer_index=0, rule_id="type_map.queue.role_persists->data")
        return BucketResult(layer_id="api", layer_index=1, rule_id="type_map.queue.role_serves->api")

    if node_type in ("svc", "ext"):
        if role == "external":
            # External services that are not infra/data default to api
            return BucketResult(layer_id="api", layer_index=1, rule_id="type_map.ext.role_external->api")
        return BucketResult(layer_id="api", layer_index=1, rule_id=f"type_map.{node_type}->api")

    # Default fallback
    return BucketResult(layer_id="api", layer_index=1, rule_id="default->api")
