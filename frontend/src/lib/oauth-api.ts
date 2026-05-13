import { api } from "./api";

export type OAuthProvider = "google" | "github";

export const oauthApi = {
  /**
   * Returns the provider authorize URL. Browser should navigate to it via
   * `window.location.href = url` so cookies stay attached.
   */
  start: (provider: OAuthProvider) =>
    api
      .get<{ authorizeUrl: string }>(`/v1/auth/oauth/${provider}/start`)
      .then((r) => r.data.authorizeUrl),
};
