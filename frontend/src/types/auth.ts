export type Role = "USER" | "COMPANY" | "ADMIN";
export type SubscriptionType = "FREE" | "PREMIUM" | "ENTERPRISE";

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  emailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: UserSummary;
}

export interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  subscriptionType: SubscriptionType;
  emailVerified: boolean;
  city: string | null;
  title: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  companyName?: string;
  taxNo?: string;
  sector?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  totpCode?: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
  fields?: Record<string, string>;
}
