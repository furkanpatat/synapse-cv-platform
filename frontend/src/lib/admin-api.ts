import { api } from "./api";
import type { AdminCompanyDto, AdminStats, AdminUserDto } from "@/types/admin";

export const adminApi = {
  stats: () => api.get<AdminStats>("/v1/admin/stats").then((r) => r.data),
  users: () => api.get<AdminUserDto[]>("/v1/admin/users").then((r) => r.data),
  companies: () =>
    api.get<AdminCompanyDto[]>("/v1/admin/companies").then((r) => r.data),
  setBanned: (userId: string, banned: boolean) =>
    api
      .put<AdminUserDto>(`/v1/admin/users/${userId}/ban`, { banned })
      .then((r) => r.data),
  setVerified: (companyId: string, verified: boolean) =>
    api
      .put<AdminCompanyDto>(`/v1/admin/companies/${companyId}/verify`, { verified })
      .then((r) => r.data),
  setPlan: (userId: string, plan: "FREE" | "PREMIUM" | "ENTERPRISE") =>
    api
      .put<AdminUserDto>(`/v1/admin/users/${userId}/plan`, { plan })
      .then((r) => r.data),
};
