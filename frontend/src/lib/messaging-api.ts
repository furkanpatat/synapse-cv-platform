import { api } from "./api";
import type {
  ConversationDto,
  MessageDto,
  SendMessagePayload,
} from "@/types/messaging";

export const messagingApi = {
  listConversations: () =>
    api.get<ConversationDto[]>("/v1/conversations").then((r) => r.data),

  getMessages: (conversationId: string) =>
    api
      .get<MessageDto[]>(`/v1/conversations/${conversationId}/messages`)
      .then((r) => r.data),

  markRead: (conversationId: string) =>
    api
      .post<{ updated: number }>(`/v1/conversations/${conversationId}/read`)
      .then((r) => r.data),

  send: (payload: SendMessagePayload) =>
    api.post<MessageDto>("/v1/conversations/messages", payload).then((r) => r.data),
};
