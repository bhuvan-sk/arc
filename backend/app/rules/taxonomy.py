"""Icon key registry — maps NodeType + heuristics to icon_key values from Icon Library v2.

All icon_key values here must correspond to entries in the FAMILIES array of Icon Library v2.
"""

# Full icon registry: all keys that exist in Icon Library v2
ICON_REGISTRY: set[str] = {
    # Data / storage family
    "db.relational",
    "db.document",
    "db.cache",
    "db.object",
    "db.warehouse",
    # API / service family
    "svc.generic",
    "svc.rest",
    "svc.auth",
    "svc.balancer",
    "svc.gateway",
    # Queue / stream family
    "q.queue",
    "q.stream",
    "q.pubsub",
    # External family
    "ext.api",
    "ext.payment",
    "ext.email",
    "ext.cdn",
    # Infra / server family
    "infra.server",
    "infra.container",
    "infra.cloud",
    "infra.observability",
}

# NodeType -> default icon_key
NODE_TYPE_DEFAULT_ICON: dict[str, str] = {
    "db": "db.relational",
    "svc": "svc.generic",
    "queue": "q.queue",
    "infra": "infra.server",
    "ext": "ext.api",
}

# Label keyword -> icon_key (evaluated before type default)
LABEL_KEYWORD_ICON: list[tuple[str, str]] = [
    # db family
    ("postgres", "db.relational"),
    ("mysql", "db.relational"),
    ("cockroach", "db.relational"),
    ("aurora", "db.relational"),
    ("tidb", "db.relational"),
    ("mongo", "db.document"),
    ("dynamo", "db.document"),
    ("firestore", "db.document"),
    ("couch", "db.document"),
    ("redis", "db.cache"),
    ("memcache", "db.cache"),
    ("elasticache", "db.cache"),
    ("s3", "db.object"),
    ("gcs", "db.object"),
    ("blob", "db.object"),
    ("object storage", "db.object"),
    ("snowflake", "db.warehouse"),
    ("bigquery", "db.warehouse"),
    ("redshift", "db.warehouse"),
    ("warehouse", "db.warehouse"),
    ("clickhouse", "db.warehouse"),
    # api/svc family
    ("gateway", "svc.gateway"),
    ("kong", "svc.gateway"),
    ("nginx", "svc.gateway"),
    ("traefik", "svc.balancer"),
    ("load balancer", "svc.balancer"),
    ("alb", "svc.balancer"),
    ("elb", "svc.balancer"),
    ("auth", "svc.auth"),
    ("cognito", "svc.auth"),
    ("keycloak", "svc.auth"),
    ("oauth", "svc.auth"),
    ("rest", "svc.rest"),
    ("api", "svc.rest"),
    # queue family
    ("kafka", "q.stream"),
    ("kinesis", "q.stream"),
    ("pubsub", "q.pubsub"),
    ("sns", "q.pubsub"),
    ("eventbridge", "q.pubsub"),
    ("sqs", "q.queue"),
    ("rabbitmq", "q.queue"),
    ("stream", "q.stream"),
    ("change stream", "q.stream"),
    ("cdc", "q.stream"),
    # ext family
    ("stripe", "ext.payment"),
    ("braintree", "ext.payment"),
    ("adyen", "ext.payment"),
    ("sendgrid", "ext.email"),
    ("ses", "ext.email"),
    ("mailgun", "ext.email"),
    ("twilio", "ext.email"),
    ("cloudflare", "ext.cdn"),
    ("fastly", "infra.cloud"),  # Fastly is infra CDN
    # infra family
    ("eks", "infra.container"),
    ("kubernetes", "infra.container"),
    ("k8s", "infra.container"),
    ("ecs", "infra.container"),
    ("docker", "infra.container"),
    ("gke", "infra.container"),
    ("aks", "infra.container"),
    ("ec2", "infra.server"),
    ("lambda", "infra.server"),
    ("cloud run", "infra.cloud"),
    ("aws", "infra.cloud"),
    ("gcp", "infra.cloud"),
    ("azure", "infra.cloud"),
    ("grafana", "infra.observability"),
    ("datadog", "infra.observability"),
    ("prometheus", "infra.observability"),
    ("jaeger", "infra.observability"),
    ("honeycomb", "infra.observability"),
    ("observe", "infra.observability"),
    ("opentelemetry", "infra.observability"),
]


def assign_icon_key(node_type: str, label: str) -> str:
    """Assign icon_key from Icon Library v2 based on node type and label keywords."""
    label_lower = label.lower()
    for keyword, icon_key in LABEL_KEYWORD_ICON:
        if keyword in label_lower:
            return icon_key
    return NODE_TYPE_DEFAULT_ICON.get(node_type, "svc.generic")


def is_valid_icon_key(key: str) -> bool:
    """Check that an icon_key exists in the registry."""
    return key in ICON_REGISTRY
