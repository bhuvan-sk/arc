"""Deterministic coverage classifier and policy table.

NO LLM CALLS ARE PERMITTED IN THIS MODULE.
"""
from app.models.enums import CoverageLevel, InfoState

INSUFFICIENT_TEMPLATE = (
    "The uploaded material contains no {layer_name}-layer information. "
    "Nothing has been inferred. Run Research this layer to fill it from public best practice — "
    "those components will be labelled inferred."
)


def classify(node_count: int, connection_count: int, stated_fact_count: int) -> CoverageLevel:
    """Classify coverage level for a layer based on item counts."""
    if node_count == 0 and stated_fact_count == 0:
        return CoverageLevel.EMPTY
    if node_count > 0 and (stated_fact_count < 2 or connection_count == 0):
        return CoverageLevel.THIN
    return CoverageLevel.RICH


def policy(
    coverage: CoverageLevel,
    session_mode: str = "A",
    research_enabled: bool = False,
) -> InfoState:
    """
    Determine InfoState based on coverage level, session mode ('A'|'B'), and research status.

    Policy matrix:
    - RICH (any mode/research) -> stated
    - THIN (Mode A, research off) -> stated
    - THIN (Mode B or research on) -> mixed
    - EMPTY (Mode A, research off) -> insufficient
    - EMPTY (Mode B or research on) -> inferred
    """
    is_research_active = session_mode.upper() == "B" or research_enabled

    if coverage == CoverageLevel.RICH:
        return InfoState.STATED

    if coverage == CoverageLevel.THIN:
        if is_research_active:
            return InfoState.MIXED
        return InfoState.STATED

    # EMPTY
    if is_research_active:
        return InfoState.INFERRED
    return InfoState.INSUFFICIENT
