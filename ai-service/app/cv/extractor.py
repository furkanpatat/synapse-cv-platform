"""Use Gemini to convert raw CV text into a structured schema."""

import json
import re

import google.generativeai as genai
from loguru import logger

from app.config import settings


SYSTEM_PROMPT = """Sen bir CV/özgeçmiş analiz uzmanısın. Verilen ham CV metnini analiz et ve
aşağıdaki JSON şemasına BİREBİR uyan bir cevap döndür. Bilgi yoksa null veya boş liste döndür.
Asla şema dışı alan ekleme, asla açıklama yazma — sadece JSON dön.

Şema:
{
  "personal": { "name": str|null, "email": str|null, "phone": str|null, "location": str|null },
  "summary": str|null,
  "skills": [str],
  "education": [
    { "school": str|null, "degree": str|null, "field": str|null,
      "startYear": str|null, "endYear": str|null }
  ],
  "experience": [
    { "company": str|null, "role": str|null, "startDate": str|null,
      "endDate": str|null, "description": str|null }
  ],
  "projects": [
    { "name": str|null, "description": str|null, "technologies": [str] }
  ],
  "languages": [str]
}
"""


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def extract_structured(raw_text: str) -> dict:
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set — returning empty structured result")
        return _empty_result()

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=SYSTEM_PROMPT,
        generation_config={"response_mime_type": "application/json"},
    )

    prompt = f"CV METNİ:\n\n{raw_text[:30000]}"
    try:
        response = model.generate_content(prompt)
        raw = response.text or ""
        cleaned = _strip_code_fence(raw)
        data = json.loads(cleaned)
        return _normalize(data)
    except Exception as ex:
        logger.exception("Gemini extraction failed: {}", ex)
        return _empty_result()


def _empty_result() -> dict:
    return {
        "personal": None,
        "summary": None,
        "skills": [],
        "education": [],
        "experience": [],
        "projects": [],
        "languages": [],
    }


def _normalize(data: dict) -> dict:
    out = _empty_result()
    if isinstance(data.get("personal"), dict):
        out["personal"] = {
            k: data["personal"].get(k) for k in ("name", "email", "phone", "location")
        }
    out["summary"] = data.get("summary")
    for key in ("skills", "languages"):
        val = data.get(key)
        out[key] = [str(x) for x in val] if isinstance(val, list) else []
    for key in ("education", "experience", "projects"):
        val = data.get(key)
        out[key] = val if isinstance(val, list) else []
    return out
