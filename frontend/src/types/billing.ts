import type { SubscriptionType } from "./auth";

export interface Usage {
  current: number;
  limit: number;
}

export interface BillingMeResponse {
  plan: SubscriptionType;
  isPremium: boolean;
  aiAnalysisLast30d: Usage;
  activeApplications: Usage;
}
