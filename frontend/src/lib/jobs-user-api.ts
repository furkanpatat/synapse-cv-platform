import { api } from "./api";
import type { ApplicationResponse, JobResponse } from "@/types/jobs";

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const userJobsApi = {
  list: (page = 0, size = 20) =>
    api
      .get<Page<JobResponse>>("/v1/jobs", { params: { page, size } })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<JobResponse>(`/v1/jobs/${id}`).then((r) => r.data),

  recommended: (limit = 5) =>
    api
      .get<JobResponse[]>("/v1/jobs/recommended", { params: { limit } })
      .then((r) => r.data),

  apply: (jobId: string, coverLetter?: string) =>
    api
      .post<ApplicationResponse>("/v1/applications", { jobId, coverLetter })
      .then((r) => r.data),

  myApplications: () =>
    api.get<ApplicationResponse[]>("/v1/applications/me").then((r) => r.data),

  save: (jobId: string) =>
    api.post<{ saved: boolean }>(`/v1/jobs/${jobId}/save`).then((r) => r.data),

  unsave: (jobId: string) =>
    api.delete<{ saved: boolean }>(`/v1/jobs/${jobId}/save`).then((r) => r.data),

  savedIds: () =>
    api.get<string[]>("/v1/jobs/saved-ids").then((r) => r.data),

  saved: () =>
    api.get<JobResponse[]>("/v1/jobs/saved").then((r) => r.data),
};
