"""PipelineStage → model/temperature resolver (thin wrapper over config)."""
from app.models.enums import PipelineStage
from app.config import settings


def model_for(stage: PipelineStage) -> str:
    """Return the model name for a given pipeline stage."""
    return settings.model_for(stage)


def temperature_for(stage: PipelineStage) -> float:
    """Return temperature for a given pipeline stage."""
    if stage == PipelineStage.PARSE:
        return settings.TEMPERATURE_PARSE
    if stage == PipelineStage.EXPLAIN:
        return settings.TEMPERATURE_EXPLAIN
    return 0.2
