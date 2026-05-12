"""Generic Gemini text-generation endpoint for backend-built prompts."""

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
import google.generativeai as genai

from app.config import settings

router = APIRouter(prefix="/v1/assistant", tags=["assistant"])


class TextRequest(BaseModel):
    systemPrompt: str = Field(..., max_length=4000)
    userPrompt: str = Field(..., max_length=20000)
    temperature: float = 0.7
    maxOutputTokens: int = 800


class TextResponse(BaseModel):
    text: str


@router.post("/text", response_model=TextResponse)
def generate_text(req: TextRequest) -> TextResponse:
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured on ai-service",
        )

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=req.systemPrompt,
        generation_config={
            "temperature": req.temperature,
            "max_output_tokens": req.maxOutputTokens,
        },
    )
    try:
        response = model.generate_content(req.userPrompt)
        text = (response.text or "").strip()
        if not text:
            raise HTTPException(status_code=502, detail="Gemini returned empty response")
        return TextResponse(text=text)
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Gemini text generation failed: {}", ex)
        raise HTTPException(status_code=502, detail=f"Gemini error: {ex}") from ex
