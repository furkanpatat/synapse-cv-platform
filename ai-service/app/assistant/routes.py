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
    # Bumped to 4000: Gemini 2.5 Flash burns part of the budget on its
    # hidden "thinking" pass, so 800-900 was leaving cüt-off responses.
    maxOutputTokens: int = 4000


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
    generation_config = {
        "temperature": req.temperature,
        "max_output_tokens": req.maxOutputTokens,
    }
    # Try to disable Gemini 2.5 Flash's hidden "thinking" step so the full
    # token budget goes to the visible answer. The thinking_config kwarg is
    # only available on newer google-generativeai builds; fall back silently
    # if the library doesn't know about it.
    try:
        from google.generativeai import types as genai_types  # type: ignore

        generation_config["thinking_config"] = genai_types.ThinkingConfig(  # type: ignore[attr-defined]
            thinking_budget=0
        )
    except Exception:
        pass

    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=req.systemPrompt,
        generation_config=generation_config,
    )
    try:
        response = model.generate_content(req.userPrompt)
        text = (response.text or "").strip()
        if not text:
            raise HTTPException(status_code=502, detail="Gemini returned empty response")
        # Detect MAX_TOKENS truncation and log a warning so we know to bump further
        try:
            finish = response.candidates[0].finish_reason  # type: ignore[index]
            if str(finish).endswith("MAX_TOKENS"):
                logger.warning(
                    "Gemini hit MAX_TOKENS — output may be truncated (chars={})",
                    len(text),
                )
        except Exception:
            pass
        return TextResponse(text=text)
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("Gemini text generation failed: {}", ex)
        raise HTTPException(status_code=502, detail=f"Gemini error: {ex}") from ex
