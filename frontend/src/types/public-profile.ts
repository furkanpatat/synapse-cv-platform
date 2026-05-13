export interface PublicProfileDto {
  handle: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  city: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  role: string;
  cvSummary: string | null;
  skills: string[];
  aiOverallScore: number | null;
  aiSummary: string | null;
  githubUsername: string | null;
  publicRepos: number | null;
  totalStars: number | null;
  aiGeneratedAt: string | null;
}
