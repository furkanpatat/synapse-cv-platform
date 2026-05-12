from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.cv.routes import router as cv_router
from app.analysis.routes import router as analysis_router
from app.assistant.routes import router as assistant_router

app = FastAPI(
    title="CV Platform — AI Service",
    description="CV parsing, GitHub analysis, and LLM-based skill verification",
    version="0.1.0",
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


@app.get("/ping")
def ping() -> dict:
    return {
        "status": "ok",
        "service": "cv-platform-ai",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
