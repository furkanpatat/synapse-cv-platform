import { api } from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  history: ChatMessage[];
}

export const chatApi = {
  history: () =>
    api.get<ChatMessage[]>("/v1/ai/chat").then((r) => r.data),

  send: (message: string) =>
    api
      .post<ChatResponse>("/v1/ai/chat", { message }, { timeout: 180000 })
      .then((r) => r.data),

  clear: () =>
    api.delete<{ cleared: boolean }>("/v1/ai/chat").then((r) => r.data),
};
