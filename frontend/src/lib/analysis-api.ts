import { api } from "./api";
import type { AnalysisReport } from "@/types/analysis";

export const analysisApi = {
  start: async (): Promise<AnalysisReport> => {
    const { data } = await api.post<AnalysisReport>("/v1/analysis/start");
    return data;
  },
  me: async (): Promise<AnalysisReport> => {
    const { data } = await api.get<AnalysisReport>("/v1/analysis/me");
    return data;
  },
};
