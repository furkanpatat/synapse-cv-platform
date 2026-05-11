import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "./auth-store";
import type { AuthResponse } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthResponse>(
      `${BASE_URL}/v1/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    useAuthStore.getState().setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
    return data.accessToken;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = original?.url ?? "";

    // Don't try to refresh on auth endpoints themselves
    const isAuthEndpoint = url.includes("/v1/auth/login")
      || url.includes("/v1/auth/register")
      || url.includes("/v1/auth/refresh");

    if ((status === 401 || status === 403) && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      if (!refreshing) refreshing = refreshTokens();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return api.request(original);
      }
    }
    return Promise.reject(error);
  }
);
