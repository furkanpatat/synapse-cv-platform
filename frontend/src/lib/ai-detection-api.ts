import { api } from "./api";

export type AiDetectionVerdict = "HUMAN" | "SUSPICIOUS" | "AI_LIKELY";

export interface AiDetectionResponse {
  probability: number;
  verdict: AiDetectionVerdict;
  signals: string[];
  detectedAt: string | null;
  reason: string;
}

export const aiDetectionApi = {
  detect: (applicationId: string) =>
    api
      .post<AiDetectionResponse>(`/v1/ai-detection/applications/${applicationId}`)
      .then((r) => r.data),
};
