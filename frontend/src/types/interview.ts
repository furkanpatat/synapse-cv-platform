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
  // AI evaluation — filled after the candidate ends the call and the
  // backend sends the transcript to Gemini.
  aiOverallScore: number | null;
  aiRecommendation: "HIRE" | "MAYBE" | "PASS" | null;
  aiSummary: string | null;
  aiStrengths: string[] | null;
  aiGaps: string[] | null;
  aiEvaluatedAt: string | null;
}
