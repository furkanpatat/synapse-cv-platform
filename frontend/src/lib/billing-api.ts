import { api } from "./api";
import type { BillingMeResponse } from "@/types/billing";

export interface IyzicoCheckoutResponse {
  paymentPageUrl: string;
  conversationId: string;
  priceTry: string;
  stubMode: string; // "true" | "false"
}

export const billingApi = {
  me: () => api.get<BillingMeResponse>("/v1/billing/me").then((r) => r.data),

  /**
   * Start an Iyzico hosted checkout. Returns the URL the browser should
   * navigate to. When Iyzico isn't configured (no API key), the backend
   * substitutes a stub URL that loops through our own callback so the
   * demo runs without real credentials.
   */
  checkout: (plan: "PREMIUM" | "ENTERPRISE") =>
    api
      .post<IyzicoCheckoutResponse>("/v1/billing/checkout", { plan })
      .then((r) => r.data),

  /** Dev-only direct upgrade — kept for demo accounts. */
  upgrade: (plan: "FREE" | "PREMIUM" | "ENTERPRISE") =>
    api.post<BillingMeResponse>("/v1/billing/upgrade", { plan }).then((r) => r.data),
};
