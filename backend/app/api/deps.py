"""FastAPI dependencies."""
from app.db.repository import repo, SessionRepository
from app.api.errors import SessionNotFoundError


def get_repo() -> SessionRepository:
    return repo


async def load_session_or_404(sid: str) -> dict:
    session = await repo.get(sid)
    if not session:
        raise SessionNotFoundError(f"Session {sid} not found")
    return session
