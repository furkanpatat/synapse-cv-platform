"""
Real-time GitHub skill detection.

Given a username, fetch their public repos and produce:
  - per-repo summaries (name, primary language, stars, last commit)
  - aggregated skills with first-seen / last-seen / repo-count
  - a year-bucketed timeline of skill activity

Skills are extracted from two sources:
  1. GitHub's "languages" map per repo (most reliable)
  2. Common manifest files where the API exposes them cheaply
     (package.json, requirements.txt, pom.xml, Cargo.toml, …)
     — these surface frameworks like React, Spring, Django that
     don't appear as their own language byte count.
"""

from __future__ import annotations

import base64
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from github import Auth, Github, GithubException
from loguru import logger
from pydantic import BaseModel, Field

from app.config import settings

router = APIRouter(prefix="/v1/github-analyze", tags=["github-analyze"])


def _client() -> Github:
    if settings.github_token:
        return Github(auth=Auth.Token(settings.github_token), per_page=100)
    logger.warning("GITHUB_TOKEN not set — analyse will rely on the 60 req/h unauthenticated quota")
    return Github(per_page=100)


# ----- request / response models -----

class AnalyzeRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=80)
    maxRepos: int = 25


class RepoSummary(BaseModel):
    name: str
    description: str | None
    primaryLanguage: str | None
    stars: int
    forks: int
    pushedAt: str | None
    createdAt: str | None
    htmlUrl: str
    skills: list[str]  # languages + manifest frameworks for this repo


class SkillStat(BaseModel):
    skill: str
    repoCount: int
    firstSeen: str | None    # ISO year-month
    lastSeen: str | None
    bytes: int               # total bytes across repos (0 for manifest-only skills)


class TimelinePoint(BaseModel):
    year: int
    skill: str
    repoCount: int


class AnalyzeResponse(BaseModel):
    username: str
    accountCreatedAt: str | None
    totalPublicRepos: int
    totalStars: int
    repos: list[RepoSummary]
    skills: list[SkillStat]
    timeline: list[TimelinePoint]


# ----- skill detection helpers -----

# Map of manifest filename → callable that parses its content and returns
# a list of (skill, language-family) tuples to attribute to the repo.
def _parse_package_json(content: str) -> list[str]:
    import json
    try:
        data = json.loads(content)
    except Exception:
        return []
    skills: set[str] = set()
    for section in ("dependencies", "devDependencies", "peerDependencies"):
        deps = data.get(section) or {}
        for name in deps.keys():
            # Map well-known packages to canonical skill names.
            n = name.lower()
            mapping = {
                "react": "React", "react-dom": "React",
                "next": "Next.js",
                "vue": "Vue", "@vue/cli": "Vue",
                "@angular/core": "Angular",
                "svelte": "Svelte",
                "typescript": "TypeScript",
                "tailwindcss": "TailwindCSS",
                "express": "Express",
                "@nestjs/core": "NestJS",
                "axios": "Axios", "redux": "Redux",
                "vite": "Vite", "webpack": "Webpack",
                "jest": "Jest", "vitest": "Vitest",
                "@playwright/test": "Playwright",
                "prisma": "Prisma", "typeorm": "TypeORM",
                "mongoose": "Mongoose",
                "graphql": "GraphQL",
                "socket.io": "Socket.IO",
            }
            if n in mapping:
                skills.add(mapping[n])
    return list(skills)


def _parse_requirements_txt(content: str) -> list[str]:
    skills: set[str] = set()
    mapping = {
        "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
        "numpy": "NumPy", "pandas": "Pandas", "scipy": "SciPy",
        "torch": "PyTorch", "tensorflow": "TensorFlow",
        "scikit-learn": "scikit-learn", "sklearn": "scikit-learn",
        "transformers": "HuggingFace Transformers",
        "sqlalchemy": "SQLAlchemy", "pydantic": "Pydantic",
        "celery": "Celery", "redis": "Redis",
        "boto3": "AWS SDK", "google-cloud-storage": "GCP SDK",
        "pytest": "pytest", "uvicorn": "Uvicorn",
        "langchain": "LangChain", "openai": "OpenAI SDK",
        "google-generativeai": "Gemini SDK",
        "sentence-transformers": "sentence-transformers",
    }
    for line in content.splitlines():
        # Strip version pin and comments
        pkg = line.split("==")[0].split(">=")[0].split("<=")[0]
        pkg = pkg.split("#")[0].strip().lower()
        if pkg in mapping:
            skills.add(mapping[pkg])
    return list(skills)


def _parse_pom_xml(content: str) -> list[str]:
    skills: set[str] = set()
    text = content.lower()
    framework_signatures = {
        "spring-boot": "Spring Boot",
        "spring-web": "Spring", "spring-data": "Spring",
        "hibernate": "Hibernate",
        "lombok": "Lombok",
        "jakarta.persistence": "JPA",
        "kafka-clients": "Kafka",
        "rabbitmq": "RabbitMQ",
        "postgresql": "PostgreSQL",
        "mysql-connector": "MySQL",
        "junit": "JUnit",
        "testcontainers": "Testcontainers",
        "mockito": "Mockito",
    }
    for sig, label in framework_signatures.items():
        if sig in text:
            skills.add(label)
    return list(skills)


def _parse_cargo_toml(content: str) -> list[str]:
    skills: set[str] = set()
    text = content.lower()
    if "tokio" in text: skills.add("Tokio")
    if "actix-web" in text: skills.add("Actix")
    if "rocket" in text: skills.add("Rocket")
    if "diesel" in text: skills.add("Diesel")
    if "serde" in text: skills.add("Serde")
    return list(skills)


MANIFEST_PARSERS = {
    "package.json": _parse_package_json,
    "requirements.txt": _parse_requirements_txt,
    "pom.xml": _parse_pom_xml,
    "Cargo.toml": _parse_cargo_toml,
}


def _scan_manifests(repo) -> list[str]:
    """Best-effort scan: try to fetch each known manifest at the repo root."""
    out: set[str] = set()
    for filename, parser in MANIFEST_PARSERS.items():
        try:
            f = repo.get_contents(filename)
            # PyGithub returns either a ContentFile or a list for directories
            if isinstance(f, list):
                continue
            content_bytes = base64.b64decode(f.content) if f.content else b""
            try:
                content = content_bytes.decode("utf-8", errors="replace")
            except Exception:
                continue
            out.update(parser(content))
        except GithubException:
            # File doesn't exist or repo is huge — skip.
            continue
        except Exception as ex:
            logger.debug("manifest scan {}: {}", filename, ex)
    return list(out)


# ----- main endpoint -----

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    gh = _client()
    try:
        user = gh.get_user(req.username)
    except GithubException as ex:
        raise HTTPException(status_code=404, detail=f"GitHub kullanıcısı bulunamadı: {req.username}") from ex

    repos: list[RepoSummary] = []
    skill_bytes: defaultdict[str, int] = defaultdict(int)
    skill_repos: defaultdict[str, set[str]] = defaultdict(set)
    skill_first_seen: dict[str, str] = {}
    skill_last_seen: dict[str, str] = {}
    timeline_counts: defaultdict[tuple[int, str], int] = defaultdict(int)

    total_stars = 0

    try:
        repo_iter = user.get_repos(type="owner", sort="pushed")
    except GithubException as ex:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {ex}") from ex

    seen = 0
    for repo in repo_iter:
        if seen >= req.maxRepos:
            break
        if repo.fork or repo.private:
            continue
        seen += 1

        # Languages (bytes per language) — robust, doesn't need file fetch
        try:
            langs = repo.get_languages()
        except GithubException:
            langs = {}
        # Manifest-derived skills (best-effort)
        manifest_skills = _scan_manifests(repo)
        # Combined per-repo skill set
        repo_skills_set: set[str] = set(langs.keys()) | set(manifest_skills)

        pushed_at = repo.pushed_at.replace(tzinfo=timezone.utc).isoformat() if repo.pushed_at else None
        created_at = repo.created_at.replace(tzinfo=timezone.utc).isoformat() if repo.created_at else None
        push_year = repo.pushed_at.year if repo.pushed_at else None
        push_yyyymm = repo.pushed_at.strftime("%Y-%m") if repo.pushed_at else None

        for skill in repo_skills_set:
            skill_repos[skill].add(repo.name)
            if skill in langs:
                skill_bytes[skill] += langs[skill]
            if push_yyyymm:
                first = skill_first_seen.get(skill)
                if first is None or push_yyyymm < first:
                    skill_first_seen[skill] = push_yyyymm
                last = skill_last_seen.get(skill)
                if last is None or push_yyyymm > last:
                    skill_last_seen[skill] = push_yyyymm
            if push_year is not None:
                timeline_counts[(push_year, skill)] += 1

        total_stars += repo.stargazers_count
        repos.append(RepoSummary(
            name=repo.name,
            description=repo.description,
            primaryLanguage=repo.language,
            stars=repo.stargazers_count,
            forks=repo.forks_count,
            pushedAt=pushed_at,
            createdAt=created_at,
            htmlUrl=repo.html_url,
            skills=sorted(repo_skills_set),
        ))

    skills = [
        SkillStat(
            skill=s,
            repoCount=len(skill_repos[s]),
            firstSeen=skill_first_seen.get(s),
            lastSeen=skill_last_seen.get(s),
            bytes=skill_bytes.get(s, 0),
        )
        for s in skill_repos
    ]
    # Sort by demand-ish: repoCount desc, then bytes desc
    skills.sort(key=lambda s: (s.repoCount, s.bytes), reverse=True)

    timeline = [
        TimelinePoint(year=year, skill=skill, repoCount=count)
        for (year, skill), count in timeline_counts.items()
    ]
    timeline.sort(key=lambda t: (t.year, -t.repoCount))

    return AnalyzeResponse(
        username=user.login,
        accountCreatedAt=user.created_at.replace(tzinfo=timezone.utc).isoformat() if user.created_at else None,
        totalPublicRepos=user.public_repos,
        totalStars=total_stars,
        repos=repos,
        skills=skills,
        timeline=timeline,
    )
