"""Table-driven test for bucket_rules.py — pure Python, no LLM required."""
import pytest
from app.rules.bucket_rules import bucket_node, BucketResult


TEST_CASES = [
    # (node_type, label, role, expected_layer, expected_index)
    ("db", "Postgres 16", "persists", "data", 0),
    ("db", "MySQL Primary", "persists", "data", 0),
    ("db", "MongoDB Replica", "persists", "data", 0),
    ("db", "DynamoDB Table", "persists", "data", 0),
    ("db", "Redis Cache", "persists", "data", 0),
    ("db", "Snowflake Warehouse", "persists", "data", 0),
    ("db", "BigQuery Analytics", "persists", "data", 0),
    ("db", "S3 Bucket", "persists", "data", 0),
    ("db", "Object Storage", "persists", "data", 0),

    ("queue", "Change Stream", "persists", "data", 0),
    ("queue", "Kafka Event Log", "persists", "data", 0),
    ("queue", "SQS Buffer", "serves", "api", 1),
    ("queue", "RabbitMQ Topic", "serves", "api", 1),

    ("svc", "Edge Gateway", "serves", "api", 1),
    ("svc", "API Gateway", "serves", "api", 1),
    ("svc", "Kong Ingress", "serves", "api", 1),
    ("svc", "Auth Service", "serves", "api", 1),
    ("svc", "Ledger API", "serves", "api", 1),
    ("svc", "Payment Controller", "serves", "api", 1),
    ("svc", "User Microservice", "serves", "api", 1),

    ("ext", "Stripe", "external", "api", 1),
    ("ext", "Twilio SMS", "external", "api", 1),
    ("ext", "Sendgrid Email", "external", "api", 1),

    ("infra", "Fastly Edge", "runs", "infra", 2),
    ("infra", "CloudFront CDN", "runs", "infra", 2),
    ("infra", "Akamai WAF", "runs", "infra", 2),
    ("infra", "EKS us-east-1", "runs", "infra", 2),
    ("infra", "Kubernetes Cluster", "runs", "infra", 2),
    ("infra", "Grafana Cloud", "runs", "infra", 2),
    ("infra", "Datadog Observability", "runs", "infra", 2),
    ("infra", "ALB Load Balancer", "runs", "infra", 2),
    ("infra", "ELB Ingress", "runs", "infra", 2),
    ("infra", "Prometheus Metrics", "runs", "infra", 2),
    ("infra", "Terraform State", "runs", "infra", 2),
]


@pytest.mark.parametrize("node_type,label,role,expected_layer,expected_index", TEST_CASES)
def test_bucket_node(node_type: str, label: str, role: str, expected_layer: str, expected_index: int):
    result: BucketResult = bucket_node(node_type, label, role)
    assert result.layer_id == expected_layer
    assert result.layer_index == expected_index
    assert result.rule_id != ""
