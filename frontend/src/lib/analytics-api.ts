import { api } from "./api";
import type { AdminAnalyticsDto, CompanyAnalyticsDto } from "@/types/analytics";

export const analyticsApi = {
  company: () =>
    api.get<CompanyAnalyticsDto>("/v1/analytics/company").then((r) => r.data),
  admin: () =>
    api.get<AdminAnalyticsDto>("/v1/analytics/admin").then((r) => r.data),
};
