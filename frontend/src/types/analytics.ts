export interface TimePoint {
  day: string;
  value: number;
}

export interface TopJob {
  jobId: string;
  title: string;
  applications: number;
  views: number;
}

export interface CompanyAnalyticsDto {
  companyName: string;
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalApplications: number;
  totalViews: number;
  offers: number;
  avgTimeToOfferDays: number | null;
  funnel: Record<string, number>;
  topJobs: TopJob[];
  applicationsLast14Days: TimePoint[];
}

export interface SkillCount {
  skill: string;
  count: number;
}

export interface AdminAnalyticsDto {
  totalUsers: number;
  bannedUsers: number;
  verifiedEmails: number;
  totalCompanies: number;
  verifiedCompanies: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalCvs: number;
  totalAiAnalyses: number;
  usersByRole: Record<string, number>;
  planDistribution: Record<string, number>;
  usersLast30Days: TimePoint[];
  topSkills: SkillCount[];
}
