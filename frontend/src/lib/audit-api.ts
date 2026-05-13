import { api } from "./api";
import type { AuditFilters, AuditLogEntry, AuditPage } from "@/types/audit";

export const auditApi = {
  list: (filters: AuditFilters = {}) =>
    api
      .get<AuditPage>("/v1/audit", {
        params: {
          page: filters.page ?? 0,
          size: filters.size ?? 50,
          eventType: filters.eventType || undefined,
          actorId: filters.actorId || undefined,
          sinceHours: filters.sinceHours || undefined,
        },
      })
      .then((r) => r.data),

  mine: () =>
    api.get<AuditLogEntry[]>("/v1/audit/me").then((r) => r.data),
};
