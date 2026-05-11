from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from app.cv import extractor, parser, storage

router = APIRouter(prefix="/v1/cv", tags=["cv"])


class ParseRequest(BaseModel):
    userId: str
    fileObjectName: str


class ParseResponse(BaseModel):
    rawText: str
    personal: dict | None = None
    summary: str | None = None
    skills: list[str] = []
    education: list[dict] = []
    experience: list[dict] = []
    projects: list[dict] = []
    languages: list[str] = []


@router.post("/parse", response_model=ParseResponse)
def parse_cv(req: ParseRequest) -> ParseResponse:
    logger.info("Parsing CV for user={} object={}", req.userId, req.fileObjectName)
    try:
        file_bytes = storage.download(req.fileObjectName)
    except Exception as ex:
        logger.exception("Failed to download from MinIO: {}", ex)
        raise HTTPException(status_code=500, detail=f"MinIO download failed: {ex}") from ex

    try:
        raw_text = parser.extract_text(file_bytes, req.fileObjectName)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    except Exception as ex:
        logger.exception("Text extraction failed: {}", ex)
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {ex}") from ex

    if not raw_text:
        raise HTTPException(status_code=422, detail="No text could be extracted from the file")

    structured = extractor.extract_structured(raw_text)
    return ParseResponse(rawText=raw_text, **structured)
