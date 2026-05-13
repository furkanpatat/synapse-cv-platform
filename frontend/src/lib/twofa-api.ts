import { api } from "./api";

export interface TotpSetupResponse {
  secret: string;
  qrDataUri: string;
  otpAuthUri: string;
}

export const twoFactorApi = {
  status: () =>
    api
      .get<{ enabled: boolean }>("/v1/auth/2fa/status")
      .then((r) => r.data.enabled),

  setup: () =>
    api
      .post<TotpSetupResponse>("/v1/auth/2fa/setup")
      .then((r) => r.data),

  verify: (code: string) =>
    api
      .post<{ enabled: boolean }>("/v1/auth/2fa/verify", { code })
      .then((r) => r.data.enabled),

  disable: (code: string) =>
    api
      .post<{ enabled: boolean }>("/v1/auth/2fa/disable", { code })
      .then((r) => r.data.enabled),
};
