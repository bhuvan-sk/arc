"""Layer lexicon — per-layer trigger terms for scope_guard Gate 3.

NO LLM CALLS ARE PERMITTED IN THIS MODULE.
"""

LAYER_LEXICON: dict[str, list[str]] = {
    "infra": [
        "kubernetes", "k8s", "eks", "aks", "gke", "autoscal", "autoscale",
        "load balancer", "load-balancer", "deploy", "deployment", "region",
        "availability zone", "az", "cluster", "ingress", "terraform",
        "helm", "docker", "container", "pod", "node pool", "replica set",
        "horizontal pod", "hpa", "vpa", "node autoscaler",
        "cpu limit", "memory limit", "resource quota",
        "observability", "monitoring", "prometheus", "grafana", "datadog",
        "tracing", "telemetry", "opentelemetry", "logging",
        "cdn", "edge network", "cloudfront", "fastly", "cloudflare",
        "vpc", "subnet", "security group", "nacl", "iam role",
    ],
    "api": [
        "gateway", "api gateway", "endpoint", "rest", "grpc", "graphql",
        "rate limit", "rate-limit", "auth flow", "service boundary",
        "service mesh", "circuit breaker", "timeout", "retry",
        "middleware", "handler", "controller", "route",
        "idempotent", "idempotency", "request", "response",
        "http", "https", "tls", "ssl", "jwt", "oauth", "api key",
    ],
    "data": [
        "schema", "index", "partition", "retention", "consistency",
        "transaction", "acid", "eventual consistency",
        "replication", "write-ahead log", "wal", "cdc",
        "b-tree", "lsm", "compaction", "vacuum",
        "primary key", "foreign key", "join", "query plan",
        "materialized view", "shard", "sharding",
        "backup", "snapshot", "point in time",
        "database", "db", "storage", "warehouse",
    ],
}
