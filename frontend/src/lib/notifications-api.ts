import { api } from "./api";
import type { NotificationFeed } from "@/types/notification";

export const notificationsApi = {
  list: (page = 0, size = 20) =>
    api
      .get<NotificationFeed>("/v1/notifications", { params: { page, size } })
      .then((r) => r.data),

  markRead: (id: string) =>
    api.post<{ updated: number }>(`/v1/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.post<{ updated: number }>("/v1/notifications/read-all").then((r) => r.data),
};
