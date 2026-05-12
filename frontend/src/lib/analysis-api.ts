import { api } from "./api";
import type { AnalysisReport } from "@/types/analysis";

export const analysisApi = {
  start: async (): Promise<AnalysisReport> => {
    const { data } = await api.post<AnalysisReport>("/v1/analysis/start", undefined, {
      timeout: 180000,
    });
    return data;
  },
  me: async (): Promise<AnalysisReport> => {
    const { data } = await api.get<AnalysisReport>("/v1/analysis/me");
    return data;
  },
  downloadPdf: async (): Promise<void> => {
    const res = await api.get("/v1/analysis/me/report.pdf", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "synapse-yetkinlik-raporu.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
