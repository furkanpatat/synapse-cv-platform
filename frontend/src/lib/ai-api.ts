import { api } from "./api";

const longTimeout = { timeout: 180000 };

export const aiApi = {
  coverLetter: (jobId: string) =>
    api
      .post<{ text: string }>(`/v1/ai/cover-letter/${jobId}`, undefined, longTimeout)
      .then((r) => r.data.text),

  bio: () =>
    api
      .post<{ text: string }>(`/v1/ai/bio`, undefined, longTimeout)
      .then((r) => r.data.text),

  matchExplanation: (jobId: string) =>
    api
      .get<{ text: string }>(`/v1/ai/match-explanation/${jobId}`, longTimeout)
      .then((r) => r.data.text),

  skillGap: (jobId: string) =>
    api
      .get<{ text: string }>(`/v1/ai/skill-gap/${jobId}`, longTimeout)
      .then((r) => r.data.text),

  hiringBrief: (applicationId: string) =>
    api
      .get<{ text: string }>(`/v1/ai/hiring-brief/${applicationId}`, longTimeout)
      .then((r) => r.data.text),
};
