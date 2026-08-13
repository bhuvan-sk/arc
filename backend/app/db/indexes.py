from app.db.client import get_database


async def ensure_indexes():
    db = get_database()
    await db.sessions.create_index([("created_at", -1)])
    await db.sessions.create_index([("status", 1)])
