"""Scale bands and concern×band decision matrix.

NO LLM CALLS ARE PERMITTED IN THIS MODULE.
"""
from dataclasses import dataclass


@dataclass
class ScaleDecision:
    rule_id: str
    concern: str
    decision: str       # verbatim — LLM may never alter this text
    tradeoff_seed: str


# ─────────────────────────────────────────────────────────────────────────────
# Band thresholds (DAU-based, supplemented by RPS)
# ─────────────────────────────────────────────────────────────────────────────
BAND_THRESHOLDS = [
    # (band_name, min_dau, max_dau, min_rps_peak, max_rps_peak)
    ("small",  0,        9_999,    0,      199),
    ("medium", 10_000,   499_999,  200,    9_999),
    ("large",  500_000,  9_999_999, 10_000, 299_999),
    ("hyper",  10_000_000, None,   300_000, None),
]


def classify_band(dau: float | None, rps_peak: float | None) -> str:
    """
    Classify the scale band from DAU or RPS.
    Returns 'unknown' when no usable numbers are available.
    """
    if dau is None and rps_peak is None:
        return "unknown"

    for band_name, min_dau, max_dau, min_rps, max_rps in BAND_THRESHOLDS:
        if dau is not None:
            if min_dau <= dau and (max_dau is None or dau < max_dau):
                return band_name
        if rps_peak is not None:
            if min_rps <= rps_peak and (max_rps is None or rps_peak < max_rps):
                return band_name

    return "unknown"


# ─────────────────────────────────────────────────────────────────────────────
# Concern × band decision matrix
# ─────────────────────────────────────────────────────────────────────────────
SCALE_DECISIONS: dict[str, dict[str, ScaleDecision]] = {
    "replication": {
        "small": ScaleDecision(
            rule_id="scale.replication.small",
            concern="replication",
            decision="Single primary, no standbys needed at this scale.",
            tradeoff_seed="No HA, acceptable for low traffic"
        ),
        "medium": ScaleDecision(
            rule_id="scale.replication.medium",
            concern="replication",
            decision="One synchronous standby plus async read replicas.",
            tradeoff_seed="read-your-writes breaks on async replicas"
        ),
        "large": ScaleDecision(
            rule_id="scale.replication.large",
            concern="replication",
            decision="Synchronous standby in a second AZ, two async read replicas per AZ.",
            tradeoff_seed="replication lag under write bursts"
        ),
        "hyper": ScaleDecision(
            rule_id="scale.replication.hyper",
            concern="replication",
            decision="Active-active multi-region with CRDTs or saga-based conflict resolution.",
            tradeoff_seed="eventual consistency, complexity"
        ),
    },
    "caching": {
        "small": ScaleDecision(
            rule_id="scale.caching.small",
            concern="caching",
            decision="No distributed cache; database handles read load.",
            tradeoff_seed="simpler ops, acceptable hit on DB"
        ),
        "medium": ScaleDecision(
            rule_id="scale.caching.medium",
            concern="caching",
            decision="Redis cache for session data and hot read paths.",
            tradeoff_seed="cache invalidation complexity, stale reads"
        ),
        "large": ScaleDecision(
            rule_id="scale.caching.large",
            concern="caching",
            decision="Multi-tier caching: CDN edge + Redis cluster with read-through.",
            tradeoff_seed="cold start and thundering-herd risk"
        ),
        "hyper": ScaleDecision(
            rule_id="scale.caching.hyper",
            concern="caching",
            decision="Regional caching clusters with consistent hashing, automatic rebalancing.",
            tradeoff_seed="distributed cache coherence across regions"
        ),
    },
    "sharding": {
        "small": ScaleDecision(
            rule_id="scale.sharding.small",
            concern="sharding",
            decision="Single database instance; no sharding required.",
            tradeoff_seed="simpler consistency model"
        ),
        "medium": ScaleDecision(
            rule_id="scale.sharding.medium",
            concern="sharding",
            decision="Vertical scaling with read replicas; no sharding yet.",
            tradeoff_seed="single-writer bottleneck at high write load"
        ),
        "large": ScaleDecision(
            rule_id="scale.sharding.large",
            concern="sharding",
            decision="Application-level sharding by tenant or entity id, 16+ shards.",
            tradeoff_seed="cross-shard queries are expensive"
        ),
        "hyper": ScaleDecision(
            rule_id="scale.sharding.hyper",
            concern="sharding",
            decision="Distributed database (CockroachDB / Spanner) with automatic range sharding.",
            tradeoff_seed="higher latency per query due to distributed consensus"
        ),
    },
    "cdn": {
        "small": ScaleDecision(
            rule_id="scale.cdn.small",
            concern="cdn",
            decision="No CDN required; direct origin serving.",
            tradeoff_seed="higher latency for geographically dispersed users"
        ),
        "medium": ScaleDecision(
            rule_id="scale.cdn.medium",
            concern="cdn",
            decision="CDN for static assets and TLS termination.",
            tradeoff_seed="dynamic content bypass means origin still bottlenecks"
        ),
        "large": ScaleDecision(
            rule_id="scale.cdn.large",
            concern="cdn",
            decision="Full CDN with edge caching, WAF, and DDoS protection.",
            tradeoff_seed="cache-busting strategy complexity"
        ),
        "hyper": ScaleDecision(
            rule_id="scale.cdn.hyper",
            concern="cdn",
            decision="Multi-CDN with anycast routing and origin shield.",
            tradeoff_seed="consistency across CDN providers"
        ),
    },
}


def get_decisions_for_band(band: str) -> list[ScaleDecision]:
    """Return all scale decisions for a given band. Empty list if band is 'unknown'."""
    if band == "unknown":
        return []
    results = []
    for concern, band_map in SCALE_DECISIONS.items():
        if band in band_map:
            results.append(band_map[band])
    return results
