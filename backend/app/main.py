import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.client import get_database, close_mongo_connection
from app.db.indexes import ensure_indexes
from app.api.errors import AppError, app_error_handler
from app.api.routes_sessions import router as sessions_router
from app.api.routes_layers import router as layers_router
from app.api.routes_chat import router as chat_router
from app.api.routes_export import router as export_router
from app.api.routes_live import router as live_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        await ensure_indexes()
    except Exception as e:
        print(f"Warning: Failed to ensure Mongo indexes: {e}")
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Architecture Explainer API",
    lifespan=lifespan
)

app.add_exception_handler(AppError, app_error_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
app.include_router(layers_router)
app.include_router(chat_router)
app.include_router(export_router)
app.include_router(live_router)


@app.get("/api/health")
async def health_check():
    mongo_ok = False
    try:
        db = get_database()
        res = await db.command("ping")
        mongo_ok = res.get("ok") == 1.0 or res.get("ok") == 1
    except Exception:
        mongo_ok = False

    openai_configured = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip())
    gemini_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    return {
        "ok": mongo_ok,
        "mongo": mongo_ok,
        "openai_configured": openai_configured,
        "gemini_configured": gemini_configured
    }
