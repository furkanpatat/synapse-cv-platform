from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

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


@app.get("/ping")
def ping() -> dict:
    return {
        "status": "ok",
        "service": "cv-platform-ai",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
