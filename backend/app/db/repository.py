"""Repository layer for MongoDB `sessions` collection CRUD operations."""
from typing import Optional, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.client import get_database
from app.models.session import SessionDoc, ChatMessageDoc, ExportRecordDoc, PipelineRunDoc, LayerDoc


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SessionRepository:
    def __init__(self, db: AsyncIOMotorDatabase | None = None):
        self._db = db

    @property
    def db(self) -> AsyncIOMotorDatabase:
        return get_database()

    async def create(self, session: SessionDoc) -> SessionDoc:
        d = session.model_dump(by_alias=True, mode="json")
        await self.db.sessions.insert_one(d)
        return session

    async def get(self, session_id: str) -> Optional[dict[str, Any]]:
        return await self.db.sessions.find_one({"_id": session_id})

    async def list_sessions(self, limit: int = 100) -> list[dict[str, Any]]:
        """Lightweight summary rows for the session picker — counts are computed
        server-side via $size so we never pull full graph/layer documents over
        the wire just to list them."""
        pipeline = [
            {"$sort": {"created_at": -1}},
            {"$limit": limit},
            {"$project": {
                "_id": 1, "title": 1, "subtitle": 1, "session_mode": 1, "status": 1,
                "error": 1, "created_at": 1, "updated_at": 1, "unlocked_index": 1,
                "node_count": {"$size": {"$ifNull": ["$graph.nodes", []]}},
                "layer_count": {"$size": {"$ifNull": ["$layers", []]}},
            }},
        ]
        return await self.db.sessions.aggregate(pipeline).to_list(length=limit)

    async def set_status(self, session_id: str, status: str, error: str | None = None):
        update = {"status": status, "updated_at": now_iso()}
        if error is not None:
            update["error"] = error
        await self.db.sessions.update_one({"_id": session_id}, {"$set": update})

    async def set_graph_and_layers(
        self,
        session_id: str,
        graph_data: dict[str, Any],
        layers_data: list[dict[str, Any]],
        title: str | None = None,
    ):
        update = {
            "graph": graph_data,
            "layers": layers_data,
            "updated_at": now_iso(),
        }
        if title:
            update["title"] = title
        await self.db.sessions.update_one({"_id": session_id}, {"$set": update})

    async def set_layer(self, session_id: str, layer_index: int, layer_data: dict[str, Any]):
        await self.db.sessions.update_one(
            {"_id": session_id},
            {"$set": {f"layers.{layer_index}": layer_data, "updated_at": now_iso()}}
        )

    async def set_unlocked(self, session_id: str, unlocked_index: int):
        await self.db.sessions.update_one(
            {"_id": session_id},
            {"$set": {"unlocked_index": unlocked_index, "updated_at": now_iso()}}
        )

    async def set_active(self, session_id: str, active_index: int):
        await self.db.sessions.update_one(
            {"_id": session_id},
            {"$set": {"active_index": active_index, "updated_at": now_iso()}}
        )

    async def set_layout(self, session_id: str, layout: dict[str, Any]):
        await self.db.sessions.update_one(
            {"_id": session_id},
            {"$set": {"layout": layout, "updated_at": now_iso()}}
        )

    async def append_chat(self, session_id: str, message: dict[str, Any]):
        await self.db.sessions.update_one(
            {"_id": session_id},
            {"$push": {"chat": message}, "$set": {"updated_at": now_iso()}}
        )

    async def append_export(self, session_id: str, export_record: dict[str, Any]):
        await self.db.sessions.update_one(
            {"_id": session_id},
            {"$push": {"exports": export_record}, "$set": {"updated_at": now_iso()}}
        )

    async def append_pipeline_run(self, session_id: str, run_record: dict[str, Any]):
        await self.db.sessions.update_one(
            {"_id": session_id},
            {"$push": {"pipeline_runs": run_record}, "$set": {"updated_at": now_iso()}}
        )


repo = SessionRepository()
