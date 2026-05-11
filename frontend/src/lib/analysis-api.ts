import { api } from "./api";
import type { AnalysisReport } from "@/types/analysis";

export const analysisApi = {
  start: async (): Promise<AnalysisReport> => {
    // Gemini + GitHub fetch can take 30-90s; allow 3 min before giving up.
    const { data } = await api.post<AnalysisReport>("/v1/analysis/start", undefined, {
      timeout: 180000,
    });
    return data;
  },
  me: async (): Promise<AnalysisReport> => {
    const { data } = await api.get<AnalysisReport>("/v1/analysis/me");
    return data;
  },
};
