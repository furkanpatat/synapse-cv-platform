import { api } from "./api";
import type { CvResponse } from "@/types/cv";

export const cvApi = {
  upload: async (file: File): Promise<CvResponse> => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post<CvResponse>("/v1/cv/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  me: async (): Promise<CvResponse> => {
    const { data } = await api.get<CvResponse>("/v1/cv/me");
    return data;
  },

  update: async (payload: Partial<CvResponse>): Promise<CvResponse> => {
    const { data } = await api.put<CvResponse>("/v1/cv/me", payload);
    return data;
  },

  /**
   * Builder-mode upsert. Backend creates a CvDocument if the user
   * doesn't already have one, or overwrites the latest one with the
   * supplied fields. Same shape as `update` but works on empty state.
   */
  saveBuilder: async (payload: Partial<CvResponse>): Promise<CvResponse> => {
    const { data } = await api.post<CvResponse>("/v1/cv/builder", payload);
    return data;
  },
};
