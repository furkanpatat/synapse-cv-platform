import type { Role, SubscriptionType } from "./auth";

export interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  verifiedCompanies: number;
  pendingCompanies: number;
  bannedUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
}

export interface AdminUserDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  subscriptionType: SubscriptionType;
  emailVerified: boolean;
  banned: boolean;
  createdAt: string;
}

export interface AdminCompanyDto {
  id: string;
  name: string;
  taxNo: string | null;
  sector: string | null;
  verified: boolean;
  ownerUserId: string;
  ownerEmail: string;
  createdAt: string;
}
