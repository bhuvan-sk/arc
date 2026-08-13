"""Application exception hierarchy and FastAPI handlers."""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    code: str = "INTERNAL_ERROR"
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, message: str, detail: str | None = None):
        super().__init__(message)
        self.message = message
        self.detail = detail


class LayerLockedError(AppError):
    code = "LAYER_LOCKED"
    status_code = status.HTTP_409_CONFLICT


class ResearchNotApplicableError(AppError):
    code = "RESEARCH_NOT_APPLICABLE"
    status_code = status.HTTP_409_CONFLICT


class ExportNotReadyError(AppError):
    code = "EXPORT_NOT_READY"
    status_code = status.HTTP_409_CONFLICT


class SessionNotFoundError(AppError):
    code = "SESSION_NOT_FOUND"
    status_code = status.HTTP_404_NOT_FOUND


def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "detail": exc.detail,
            }
        },
    )
