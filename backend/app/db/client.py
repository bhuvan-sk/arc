import asyncio
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


db_client = MongoDB()


def get_database() -> AsyncIOMotorDatabase:
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if db_client.client is not None:
        client_loop = db_client.client.get_io_loop()
        if current_loop is not None and (client_loop != current_loop or client_loop.is_closed()):
            db_client.client.close()
            db_client.client = None
            db_client.db = None

    if db_client.client is None:
        db_client.client = AsyncIOMotorClient(settings.MONGO_URI)
        db_client.db = db_client.client[settings.MONGO_DB]

    return db_client.db


async def close_mongo_connection():
    if db_client.client is not None:
        db_client.client.close()
        db_client.client = None
        db_client.db = None
