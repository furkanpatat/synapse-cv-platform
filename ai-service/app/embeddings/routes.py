"""Semantic similarity (sentence-transformers) for job recommendation."""

from __future__ import annotations

from threading import Lock
from typing import List, Optional

from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel, Field

router = APIRouter(prefix="/v1/embeddings", tags=["embeddings"])

_model = None
_lock = Lock()


def _get_model():
    """Lazy-load the sentence-transformer model on first call."""
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                try:
                    from sentence_transformers import SentenceTransformer
                    logger.info("Loading sentence-transformer model (paraphrase-multilingual-MiniLM-L12-v2)...")
                    _model = SentenceTransformer(
                        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
                    )
                    logger.info("Sentence-transformer model loaded.")
                except Exception as ex:
                    logger.error("Failed to load sentence-transformer: {}", ex)
                    raise
    return _model


def _join(skills: List[str]) -> str:
    """Compact list of skills into a single string the model can encode well."""
    return ", ".join(s.strip() for s in skills if s and s.strip()) or "—"


class Candidate(BaseModel):
    id: str
    skills: List[str] = Field(default_factory=list)
    title: Optional[str] = None
    description: Optional[str] = None


class MatchRequest(BaseModel):
    reference: List[str]
    candidates: List[Candidate]
    topN: int = 10


class MatchHit(BaseModel):
    id: str
    score: float  # 0..100


class MatchResponse(BaseModel):
    hits: List[MatchHit]


@router.post("/match", response_model=MatchResponse)
def match(req: MatchRequest) -> MatchResponse:
    if not req.candidates:
        return MatchResponse(hits=[])

    try:
        model = _get_model()
        ref_text = _join(req.reference)
        cand_texts = [
            f"{c.title or ''} · {_join(c.skills)}".strip(" ·")
            for c in req.candidates
        ]
        ref_vec = model.encode([ref_text], normalize_embeddings=True)
        cand_vecs = model.encode(cand_texts, normalize_embeddings=True)
        # Cosine similarity for normalized vectors == dot product
        import numpy as np

        sims = np.dot(cand_vecs, ref_vec[0])  # shape: (N,)
        # Map to 0..100
        scaled = ((sims + 1) / 2 * 100).clip(0, 100)

        scored = sorted(
            [(req.candidates[i].id, float(scaled[i])) for i in range(len(req.candidates))],
            key=lambda x: x[1],
            reverse=True,
        )
        top = scored[: req.topN]
        return MatchResponse(hits=[MatchHit(id=cid, score=round(s, 1)) for cid, s in top])
    except Exception as ex:
        logger.exception("Embeddings match failed: {}", ex)
        # Graceful fallback: simple lexical overlap so the user still gets results
        ref_set = {s.lower().strip() for s in req.reference if s}
        scored = []
        for c in req.candidates:
            cs = {s.lower().strip() for s in c.skills if s}
            inter = len(ref_set & cs)
            denom = max(1, len(ref_set))
            scored.append((c.id, round(100.0 * inter / denom, 1)))
        scored.sort(key=lambda x: x[1], reverse=True)
        return MatchResponse(hits=[MatchHit(id=cid, score=s) for cid, s in scored[: req.topN]])
