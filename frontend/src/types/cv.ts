export type CvStatus = "PENDING" | "PARSED" | "FAILED";

export interface CvPersonal {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
}

export interface CvEducation {
  school: string | null;
  degree: string | null;
  field: string | null;
  startYear: string | null;
  endYear: string | null;
}

export interface CvExperience {
  company: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface CvProject {
  name: string | null;
  description: string | null;
  technologies: string[] | null;
}

export interface CvResponse {
  id: string;
  originalFilename: string;
  fileDownloadUrl: string | null;
  status: CvStatus;
  errorMessage: string | null;
  personal: CvPersonal | null;
  summary: string | null;
  skills: string[] | null;
  education: CvEducation[] | null;
  experience: CvExperience[] | null;
  projects: CvProject[] | null;
  languages: string[] | null;
  updatedAt: string;
}
