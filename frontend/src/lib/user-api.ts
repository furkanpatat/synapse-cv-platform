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
};
