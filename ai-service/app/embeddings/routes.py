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


class ClusterRequest(BaseModel):
    skills: List[str]
    # Threshold (0..1) above which we draw an edge between two skills.
    edgeThreshold: float = 0.45
    # Max number of edges per skill (keeps the graph readable).
    maxEdgesPerSkill: int = 4


class GraphEdge(BaseModel):
    source: str
    target: str
    weight: float  # 0..1, cosine similarity


class GraphNode(BaseModel):
    id: str
    cluster: int


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


@router.post("/cluster", response_model=GraphResponse)
def cluster(req: ClusterRequest) -> GraphResponse:
    """Build a force-graph-ready node/edge list for a set of skills.

    Each skill is embedded, then we compute pairwise cosine similarity, draw
    edges above the threshold, and run a tiny union-find on the edges so the
    UI can colour skills by semantic cluster (e.g. "frontend" vs "data eng").

    Falls back to a string-similarity heuristic if sentence-transformers isn't
    available — caller still gets a usable graph.
    """
    skills = [s.strip() for s in req.skills if s and s.strip()]
    # De-dup while preserving order.
    seen: set[str] = set()
    skills = [s for s in skills if not (s.lower() in seen or seen.add(s.lower()))]
    if len(skills) < 2:
        return GraphResponse(
            nodes=[GraphNode(id=s, cluster=0) for s in skills], edges=[]
        )

    edges: list[GraphEdge] = []
    try:
        import numpy as np

        model = _get_model()
        vecs = model.encode(skills, normalize_embeddings=True)
        sim = np.dot(vecs, vecs.T)  # (N, N)
        n = len(skills)
        # For each node, keep its top-K neighbors above threshold.
        for i in range(n):
            order = np.argsort(-sim[i])
            kept = 0
            for j in order:
                if j == i:
                    continue
                if sim[i, j] < req.edgeThreshold:
                    break
                if kept >= req.maxEdgesPerSkill:
                    break
                a, b = skills[i], skills[j]
                # Canonical order so we don't insert (a,b) and (b,a)
                if a > b:
                    a, b = b, a
                edges.append(GraphEdge(source=a, target=b, weight=round(float(sim[i, j]), 3)))
                kept += 1
    except Exception as ex:
        logger.warning("cluster: embedding path failed, using lexical fallback: {}", ex)
        # Very rough Jaccard on character bigrams.
        def bigrams(s: str) -> set[str]:
            s = s.lower()
            return {s[k : k + 2] for k in range(len(s) - 1)} if len(s) > 1 else {s}

        bg = [bigrams(s) for s in skills]
        for i in range(len(skills)):
            scored = []
            for j in range(len(skills)):
                if i == j:
                    continue
                inter = len(bg[i] & bg[j])
                denom = max(1, len(bg[i] | bg[j]))
                scored.append((j, inter / denom))
            scored.sort(key=lambda t: t[1], reverse=True)
            for j, score in scored[: req.maxEdgesPerSkill]:
                if score < req.edgeThreshold:
                    break
                a, b = skills[i], skills[j]
                if a > b:
                    a, b = b, a
                edges.append(GraphEdge(source=a, target=b, weight=round(float(score), 3)))

    # Dedup edges (we may have added (a,b) from both directions).
    seen_edges: set[tuple[str, str]] = set()
    unique_edges: list[GraphEdge] = []
    for e in edges:
        key = (e.source, e.target)
        if key in seen_edges:
            continue
        seen_edges.add(key)
        unique_edges.append(e)

    # Union-find for cluster assignment.
    parent: dict[str, str] = {s: s for s in skills}

    def find(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for e in unique_edges:
        union(e.source, e.target)

    roots: dict[str, int] = {}
    nodes: list[GraphNode] = []
    for s in skills:
        r = find(s)
        if r not in roots:
            roots[r] = len(roots)
        nodes.append(GraphNode(id=s, cluster=roots[r]))

    return GraphResponse(nodes=nodes, edges=unique_edges)


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
