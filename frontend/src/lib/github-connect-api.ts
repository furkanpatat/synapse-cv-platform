import { api } from "./api";

export interface GithubConnectStatus {
  connected: boolean;
  login: string;
  scopes: string;
  connectedAt: string | null;
}

export const githubConnectApi = {
  status: () =>
    api
      .get<GithubConnectStatus>("/v1/github-connect/status")
      .then((r) => r.data),

  start: () =>
    api
      .get<{ authorizeUrl: string }>("/v1/github-connect/start")
      .then((r) => r.data.authorizeUrl),

  disconnect: () =>
    api
      .delete<{ connected: boolean }>("/v1/github-connect")
      .then((r) => r.data),
};
