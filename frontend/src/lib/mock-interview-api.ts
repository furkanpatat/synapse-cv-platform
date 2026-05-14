import { api } from "./api";

export type MockInterviewLevel = "JUNIOR" | "MID" | "SENIOR" | "LEAD";
export type MockInterviewStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type MockInterviewSector =
  | "TEKNOLOJI"
  | "SAGLIK"
  | "EGITIM"
  | "FINANS"
  | "PAZARLAMA"
  | "TASARIM"
  | "HUKUK"
  | "INSAN_KAYNAKLARI"
  | "OPERASYON"
  | "URETIM"
  | "MEDYA"
  | "SATIS"
  | "MUSTERI_HIZMETLERI"
  | "DANISMANLIK";

export const MOCK_INTERVIEW_SECTORS: { value: MockInterviewSector; label: string; icon: string }[] = [
  { value: "TEKNOLOJI", label: "Teknoloji / Yazılım", icon: "💻" },
  { value: "SAGLIK", label: "Sağlık", icon: "🩺" },
  { value: "EGITIM", label: "Eğitim", icon: "🎓" },
  { value: "FINANS", label: "Finans / Bankacılık", icon: "💰" },
  { value: "PAZARLAMA", label: "Pazarlama / Reklam", icon: "📣" },
  { value: "TASARIM", label: "Tasarım / UX", icon: "🎨" },
  { value: "HUKUK", label: "Hukuk", icon: "⚖️" },
  { value: "INSAN_KAYNAKLARI", label: "İnsan Kaynakları", icon: "🧑‍💼" },
  { value: "OPERASYON", label: "Operasyon / Lojistik", icon: "📦" },
  { value: "URETIM", label: "Üretim / Mühendislik", icon: "🏭" },
  { value: "MEDYA", label: "Medya / İçerik", icon: "🎬" },
  { value: "SATIS", label: "Satış", icon: "📈" },
  { value: "MUSTERI_HIZMETLERI", label: "Müşteri Hizmetleri", icon: "🎧" },
  { value: "DANISMANLIK", label: "Danışmanlık", icon: "📊" },
];

export interface PerQuestionScore {
  score: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
}

export interface MockInterviewDto {
  id: string;
  roleTitle: string;
  level: MockInterviewLevel;
  sector: MockInterviewSector;
  jobPostingId: string | null;
  jobPostingTitle: string | null;
  jobPostingCompany: string | null;
  questions: string[];
  answers: string[];
  perQuestionScores: PerQuestionScore[] | null;
  overallScore: number | null;
  starCompliance: number | null;
  overallSummary: string | null;
  status: MockInterviewStatus;
  createdAt: string;
  completedAt: string | null;
}

export const mockInterviewApi = {
  start: (
    roleTitle: string,
    level: MockInterviewLevel,
    sector: MockInterviewSector,
    jobPostingId?: string | null
  ) =>
    api
      .post<MockInterviewDto>("/v1/mock-interviews", {
        roleTitle,
        level,
        sector,
        jobPostingId: jobPostingId ?? null,
      })
      .then((r) => r.data),

  submit: (id: string, questionIndex: number, transcript: string) =>
    api
      .post<MockInterviewDto>(`/v1/mock-interviews/${id}/answers`, {
        questionIndex,
        transcript,
      })
      .then((r) => r.data),

  finalize: (id: string) =>
    api
      .post<MockInterviewDto>(`/v1/mock-interviews/${id}/finalize`)
      .then((r) => r.data),

  get: (id: string) =>
    api.get<MockInterviewDto>(`/v1/mock-interviews/${id}`).then((r) => r.data),

  mine: () =>
    api.get<MockInterviewDto[]>("/v1/mock-interviews").then((r) => r.data),
};
