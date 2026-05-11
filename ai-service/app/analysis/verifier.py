"""Use Gemini to verify CV skills against GitHub activity."""

import json
import re
from typing import Any

import google.generativeai as genai
from loguru import logger

from app.config import settings


SYSTEM_PROMPT = """Sen objektif bir yetkinlik doğrulama uzmanısın. Sana bir adayın CV'sinde
beyan ettiği yetenek listesi ile GitHub profil verisi verilir. Görevin:

1. Her CV skill'i için GitHub verisine bakarak 0-100 arası bir GERÇEKLEME PUANI ver.
2. confidence: LOW (yetersiz kanıt), MEDIUM (kısmi kanıt), HIGH (güçlü kanıt).
3. evidenceRepos: skill ile ilgili repo adlarını listele (yoksa boş liste).
4. explanation: TÜRKÇE, 1-2 cümle açıklama. Spesifik repo/dil/satır referansı ver.
5. CV'de iddia edilen ama GitHub'da hiç kanıt olmayan skill'ler için inconsistencies'a ekle.
6. overallScore: 0-100 (tüm skill puanlarının ağırlıklı ortalaması).
7. summary: 2-3 cümle genel değerlendirme (TÜRKÇE).

CEVABI MUTLAKA SADECE JSON OLARAK DÖN. Şema:

{
  "overallScore": int,
  "summary": str,
  "skillScores": [
    {
      "skill": str,
      "score": int,
      "confidence": "LOW" | "MEDIUM" | "HIGH",
      "explanation": str,
      "evidenceRepos": [str]
    }
  ],
  "inconsistencies": [
    {
      "claimedSkill": str,
      "issue": str,
      "severity": "LOW" | "MEDIUM" | "HIGH"
    }
  ]
}
"""


def _strip_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def verify_skills(cv_skills: list[str], github_data: dict[str, Any]) -> dict[str, Any]:
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set — returning empty analysis")
        return _empty_result()

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=SYSTEM_PROMPT,
        generation_config={"response_mime_type": "application/json"},
    )

    prompt_payload = {
        "cvSkills": cv_skills,
        "github": github_data,
    }
    prompt = (
        "Aşağıdaki veriyi analiz et ve şemadaki JSON'u dön.\n\n"
        f"{json.dumps(prompt_payload, ensure_ascii=False, indent=2)}"
    )

    try:
        response = model.generate_content(prompt)
        raw = response.text or ""
        data = json.loads(_strip_fence(raw))
        return _normalize(data)
    except Exception as ex:
        logger.exception("Gemini analysis failed: {}", ex)
        return _empty_result()


def _empty_result() -> dict[str, Any]:
    return {
        "overallScore": 0,
        "summary": "Analiz yapılamadı.",
        "skillScores": [],
        "inconsistencies": [],
    }


def _normalize(data: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {
        "overallScore": int(data.get("overallScore") or 0),
        "summary": data.get("summary") or "",
        "skillScores": [],
        "inconsistencies": [],
    }
    for s in data.get("skillScores") or []:
        if not isinstance(s, dict):
            continue
        out["skillScores"].append({
            "skill": s.get("skill"),
            "score": int(s.get("score") or 0),
            "confidence": s.get("confidence") or "LOW",
            "explanation": s.get("explanation") or "",
            "evidenceRepos": s.get("evidenceRepos") or [],
        })
    for i in data.get("inconsistencies") or []:
        if not isinstance(i, dict):
            continue
        out["inconsistencies"].append({
            "claimedSkill": i.get("claimedSkill"),
            "issue": i.get("issue") or "",
            "severity": i.get("severity") or "LOW",
        })
    return out
