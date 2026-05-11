import { api } from "./api";
import type {
  AuthResponse,
  LoginPayload,
  MeResponse,
  RegisterPayload,
} from "@/types/auth";

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>("/v1/auth/register", payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/v1/auth/login", payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post("/v1/auth/logout", { refreshToken }).then((r) => r.data),

  me: () => api.get<MeResponse>("/v1/auth/me").then((r) => r.data),

  verifyEmail: (token: string) =>
    api.get(`/v1/auth/verify-email`, { params: { token } }).then((r) => r.data),
};
