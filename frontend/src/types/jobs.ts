export type JobLevel = "JUNIOR" | "MID" | "SENIOR" | "LEAD";
export type RemoteType = "REMOTE" | "HYBRID" | "ONSITE";
export type JobStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type ApplicationStatus =
  | "NEW"
  | "REVIEWING"
  | "INTERVIEW"
  | "REJECTED"
  | "OFFERED";

export interface JobResponse {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  city: string | null;
  remoteType: RemoteType;
  level: JobLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  requiredSkills: string[];
  status: JobStatus;
  viewCount: number;
  applicationCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobRequest {
  title?: string;
  description?: string;
  city?: string;
  remoteType?: RemoteType;
  level?: JobLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  requiredSkills?: string[];
  status?: JobStatus;
}

export interface ApplicationResponse {
  id: string;
  jobId: string;
  jobTitle: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userTitle: string | null;
  userCity: string | null;
  userGithubUrl: string | null;
  status: ApplicationStatus;
  atsScore: number | null;
  aiOverallScore: number | null;
  coverLetter: string | null;
  appliedAt: string;
  updatedAt: string;
}

export interface CompanyResponse {
  id: string;
  ownerUserId: string;
  name: string;
  taxNo: string | null;
  sector: string | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  verified: boolean;
  createdAt: string;
}

export interface CompanyProfileRequest {
  name?: string;
  taxNo?: string;
  sector?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
}
