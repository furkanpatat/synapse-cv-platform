import { api } from "./api";
import type {
  ApplicationResponse,
  ApplicationStatus,
  CompanyProfileRequest,
  CompanyResponse,
  JobRequest,
  JobResponse,
} from "@/types/jobs";

export const companyApi = {
  // Company profile
  getMyCompany: () => api.get<CompanyResponse>("/v1/companies/me").then((r) => r.data),
  updateMyCompany: (payload: CompanyProfileRequest) =>
    api.put<CompanyResponse>("/v1/companies/me", payload).then((r) => r.data),

  // Jobs
  listJobs: () => api.get<JobResponse[]>("/v1/company/jobs").then((r) => r.data),
  getJob: (id: string) =>
    api.get<JobResponse>(`/v1/company/jobs/${id}`).then((r) => r.data),
  createJob: (payload: JobRequest) =>
    api.post<JobResponse>("/v1/company/jobs", payload).then((r) => r.data),
  updateJob: (id: string, payload: JobRequest) =>
    api.put<JobResponse>(`/v1/company/jobs/${id}`, payload).then((r) => r.data),
  deleteJob: (id: string) =>
    api.delete<void>(`/v1/company/jobs/${id}`).then((r) => r.data),

  // Applications
  listApplications: (jobId: string) =>
    api
      .get<ApplicationResponse[]>(`/v1/company/jobs/${jobId}/applications`)
      .then((r) => r.data),
  getApplicationDetail: (id: string) =>
    api.get<{
      application: ApplicationResponse;
      cv: unknown;
      analysis: unknown;
    }>(`/v1/company/applications/${id}`).then((r) => r.data),
  updateApplicationStatus: (id: string, status: ApplicationStatus) =>
    api
      .put<ApplicationResponse>(`/v1/company/applications/${id}/status`, { status })
      .then((r) => r.data),
};
