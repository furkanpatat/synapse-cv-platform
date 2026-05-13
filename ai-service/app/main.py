from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import settings
from app.cv.routes import router as cv_router
from app.analysis.routes import router as analysis_router
from app.assistant.routes import router as assistant_router
from app.embeddings.routes import router as embeddings_router
from app.worker.analysis_worker import start_worker_in_background

app = FastAPI(
    title="CV Platform — AI Service",
    description="CV parsing, GitHub analysis, LLM skill verification, embeddings + analysis worker",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(cv_router)
app.include_router(analysis_router)
app.include_router(assistant_router)
app.include_router(embeddings_router)


@app.on_event("startup")
def _start_worker() -> None:
    """Kick off the RabbitMQ analysis-worker daemon thread."""
    try:
        start_worker_in_background()
    except Exception as ex:
        logger.exception("Failed to start analysis worker: {}", ex)


@app.get("/ping")
def ping() -> dict:
    return {
        "status": "ok",
        "service": "cv-platform-ai",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
