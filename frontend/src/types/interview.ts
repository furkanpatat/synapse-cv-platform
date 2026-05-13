export type InterviewStatus = "SCHEDULED" | "STARTED" | "ENDED" | "CANCELLED";

export interface InterviewDto {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  candidateUserId: string;
  candidateName: string;
  candidateEmail: string;
  scheduledAt: string;
  durationMin: number;
  roomToken: string;
  status: InterviewStatus;
  startedAt: string | null;
  endedAt: string | null;
}
