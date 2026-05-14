import { api } from "./api";
import type { MeResponse } from "@/types/auth";

export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  city?: string;
  title?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export const userApi = {
  updateProfile: async (payload: ProfileUpdatePayload): Promise<MeResponse> => {
    const { data } = await api.put<MeResponse>("/v1/users/me/profile", payload);
    return data;
  },

  /**
   * Multipart upload of a profile photo. Backend rejects non-images and
   * anything over 5 MB; the UI pre-checks the same so failures are fast.
   */
  uploadAvatar: async (file: File): Promise<MeResponse> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<MeResponse>("/v1/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  removeAvatar: async (): Promise<MeResponse> => {
    const { data } = await api.delete<MeResponse>("/v1/users/me/avatar");
    return data;
  },
};
