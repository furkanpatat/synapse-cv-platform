import { api } from "./api";

export interface RepoSummary {
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  pushedAt: string | null;
  createdAt: string | null;
  htmlUrl: string;
  skills: string[];
}

export interface SkillStat {
  skill: string;
  repoCount: number;
  firstSeen: string | null; // YYYY-MM
  lastSeen: string | null;
  bytes: number;
}

export interface TimelinePoint {
  year: number;
  skill: string;
  repoCount: number;
}

export interface GithubAnalyzeResponse {
  username: string;
  accountCreatedAt: string | null;
  totalPublicRepos: number;
  totalStars: number;
  repos: RepoSummary[];
  skills: SkillStat[];
  timeline: TimelinePoint[];
}

export const githubAnalyzeApi = {
  analyze: (username: string, maxRepos = 25) =>
    api
      .post<GithubAnalyzeResponse>("/v1/github-analyze/analyze", { username, maxRepos })
      .then((r) => r.data),
};
