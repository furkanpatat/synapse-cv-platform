export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export type Severity = "LOW" | "MEDIUM" | "HIGH";

export interface GithubSummary {
  publicRepos: number | null;
  totalStars: number | null;
  languageBytes: Record<string, number> | null;
  topRepos: RepoBrief[] | null;
  accountCreatedAt: string | null;
  lastActivityAt: string | null;
}

export interface RepoBrief {
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  updatedAt: string | null;
}

export interface SkillScore {
  skill: string;
  score: number;
  confidence: Confidence;
  explanation: string;
  evidenceRepos: string[];
}

export interface Inconsistency {
  claimedSkill: string;
  issue: string;
  severity: Severity;
}

export type AnalysisStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface AnalysisReport {
  id: string;
  userId: string;
  githubUsername: string;
  github: GithubSummary;
  overallScore: number;
  summary: string;
  skillScores: SkillScore[];
  inconsistencies: Inconsistency[];
  status?: AnalysisStatus;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}
