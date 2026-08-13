from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from app.models.enums import PipelineStage


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "arch_explainer"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 25
    PDF_RASTER_DPI: int = 180
    ENABLE_MODE_B: bool = False
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: Optional[str] = None
    GEMINI_API_KEY: str = ""
    MODEL_LIVE: str = "gemini-3.1-flash-live-preview"

    MODEL_DEFAULT: str = "gpt-4o-mini"
    MODEL_PARSE: Optional[str] = None
    MODEL_RESEARCH: Optional[str] = None
    MODEL_NARRATE: Optional[str] = None
    MODEL_EXPLAIN: Optional[str] = None
    MODEL_EXPORT: Optional[str] = None

    TEMPERATURE_PARSE: float = 0.0
    TEMPERATURE_EXPLAIN: float = 0.3

    def model_for(self, stage: PipelineStage) -> str:
        mapping = {
            PipelineStage.PARSE: self.MODEL_PARSE,
            PipelineStage.RESEARCH: self.MODEL_RESEARCH,
            PipelineStage.NARRATE: self.MODEL_NARRATE,
            PipelineStage.EXPLAIN: self.MODEL_EXPLAIN,
            PipelineStage.EXPORT: self.MODEL_EXPORT,
        }
        val = mapping.get(stage)
        if val and val.strip():
            return val.strip()
        return self.MODEL_DEFAULT.strip()


settings = Settings()
