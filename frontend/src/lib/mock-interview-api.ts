import { api } from "./api";

export type MockInterviewLevel = "JUNIOR" | "MID" | "SENIOR" | "LEAD";
export type MockInterviewStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export interface PerQuestionScore {
  score: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
}

export interface MockInterviewDto {
  id: string;
  roleTitle: string;
  level: MockInterviewLevel;
  questions: string[];
  answers: string[];
  perQuestionScores: PerQuestionScore[] | null;
  overallScore: number | null;
  starCompliance: number | null;
  overallSummary: string | null;
  status: MockInterviewStatus;
  createdAt: string;
  completedAt: string | null;
}

export const mockInterviewApi = {
  start: (roleTitle: string, level: MockInterviewLevel) =>
    api
      .post<MockInterviewDto>("/v1/mock-interviews", { roleTitle, level })
      .then((r) => r.data),

  submit: (id: string, questionIndex: number, transcript: string) =>
    api
      .post<MockInterviewDto>(`/v1/mock-interviews/${id}/answers`, {
        questionIndex,
        transcript,
      })
      .then((r) => r.data),

  finalize: (id: string) =>
    api
      .post<MockInterviewDto>(`/v1/mock-interviews/${id}/finalize`)
      .then((r) => r.data),

  get: (id: string) =>
    api.get<MockInterviewDto>(`/v1/mock-interviews/${id}`).then((r) => r.data),

  mine: () =>
    api.get<MockInterviewDto[]>("/v1/mock-interviews").then((r) => r.data),
};
