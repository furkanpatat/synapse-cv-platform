"""Fetch a developer profile snapshot from the GitHub REST API."""

from __future__ import annotations

from collections import Counter
from typing import Any

from github import Auth, Github, GithubException
from loguru import logger

from app.config import settings


def _client() -> Github:
    if settings.github_token:
        return Github(auth=Auth.Token(settings.github_token), per_page=100)
    logger.warning("GITHUB_TOKEN not set — unauthenticated client (60 req/h limit)")
    return Github(per_page=100)


def fetch_profile(username: str, max_repos: int = 30) -> dict[str, Any]:
    gh = _client()
    try:
        user = gh.get_user(username)
    except GithubException as ex:
        raise ValueError(f"GitHub user not found: {username}") from ex

    repos = []
    language_bytes: Counter[str] = Counter()
    total_stars = 0
    last_activity = None

    for i, repo in enumerate(user.get_repos(type="owner", sort="updated")):
        if i >= max_repos:
            break
        if repo.fork or repo.private:
            continue

        try:
            langs = repo.get_languages()
            for lang, bytes_ in langs.items():
                language_bytes[lang] += bytes_
        except GithubException:
            langs = {}

        updated_at = repo.updated_at.isoformat() if repo.updated_at else None
        if updated_at and (last_activity is None or updated_at > last_activity):
            last_activity = updated_at

        total_stars += repo.stargazers_count

        repos.append({
            "name": repo.name,
            "description": repo.description,
            "primaryLanguage": repo.language,
            "stars": repo.stargazers_count,
            "updatedAt": updated_at,
            "topLanguages": list(langs.keys())[:5],
        })

    top_repos = sorted(repos, key=lambda r: r["stars"], reverse=True)[:10]

    return {
        "username": user.login,
        "publicRepos": user.public_repos,
        "totalStars": total_stars,
        "languageBytes": dict(language_bytes),
        "topRepos": top_repos,
        "accountCreatedAt": user.created_at.isoformat() if user.created_at else None,
        "lastActivityAt": last_activity,
    }
