from enum import Enum


class NodeType(str, Enum):
    DB = "db"
    SVC = "svc"
    QUEUE = "queue"
    INFRA = "infra"
    EXT = "ext"


class LayerId(str, Enum):
    DATA = "data"
    API = "api"
    INFRA = "infra"


class Origin(str, Enum):
    STATED = "stated"
    INFERRED = "inferred"


class Transport(str, Enum):
    SYNC = "sync"
    ASYNC = "async"
    REPLICATION = "replication"
    BIDIRECTIONAL = "bidirectional"


class CoverageLevel(str, Enum):
    RICH = "rich"
    THIN = "thin"
    EMPTY = "empty"


class InfoState(str, Enum):
    STATED = "stated"
    MIXED = "mixed"
    INFERRED = "inferred"
    INSUFFICIENT = "insufficient"


class QuestionType(str, Enum):
    COMMUNICATION = "communication"
    DATA_LOCATION = "data_location"
    USER_ACTION_FLOW = "user_action_flow"
    OVERVIEW = "overview"
    OTHER = "other"


class PipelineStage(str, Enum):
    PARSE = "parse"
    RESEARCH = "research"
    BUCKET = "bucket"
    SCALE_RULES = "scale_rules"
    COVERAGE = "coverage"
    NARRATE = "narrate"
    EXPLAIN = "explain"
    EXPORT = "export"


class ScaleBand(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    HYPER = "hyper"
    UNKNOWN = "unknown"
