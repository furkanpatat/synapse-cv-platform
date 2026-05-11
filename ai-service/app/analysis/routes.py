from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from app.analysis import github, verifier

router = APIRouter(prefix="/v1/analysis", tags=["analysis"])


class AnalysisRequest(BaseModel):
    userId: str
    githubUsername: str
    cvSkills: list[str]


class GithubSummary(BaseModel):
    publicRepos: int | None = None
    totalStars: int | None = None
    languageBytes: dict[str, int] | None = None
    topRepos: list[dict] | None = None
    accountCreatedAt: str | None = None
    lastActivityAt: str | None = None


class AnalysisResponse(BaseModel):
    githubUsername: str
    github: GithubSummary
    overallScore: int
    summary: str
    skillScores: list[dict]
    inconsistencies: list[dict]


@router.post("/run", response_model=AnalysisResponse)
def run_analysis(req: AnalysisRequest) -> AnalysisResponse:
    logger.info("Running analysis for user={} github={}", req.userId, req.githubUsername)
    try:
        github_data = github.fetch_profile(req.githubUsername)
    except ValueError as ex:
        raise HTTPException(status_code=404, detail=str(ex)) from ex
    except Exception as ex:
        logger.exception("GitHub fetch failed: {}", ex)
        raise HTTPException(status_code=502, detail=f"GitHub fetch failed: {ex}") from ex

    result = verifier.verify_skills(req.cvSkills, github_data)

    return AnalysisResponse(
        githubUsername=req.githubUsername,
        github=GithubSummary(
            publicRepos=github_data.get("publicRepos"),
            totalStars=github_data.get("totalStars"),
            languageBytes=github_data.get("languageBytes"),
            topRepos=github_data.get("topRepos"),
            accountCreatedAt=github_data.get("accountCreatedAt"),
            lastActivityAt=github_data.get("lastActivityAt"),
        ),
        overallScore=result["overallScore"],
        summary=result["summary"],
        skillScores=result["skillScores"],
        inconsistencies=result["inconsistencies"],
    )
