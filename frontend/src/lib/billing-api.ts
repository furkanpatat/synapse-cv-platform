import { api } from "./api";
import type { BillingMeResponse } from "@/types/billing";

export const billingApi = {
  me: () => api.get<BillingMeResponse>("/v1/billing/me").then((r) => r.data),
};
