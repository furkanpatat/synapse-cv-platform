import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserSummary } from "@/types/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserSummary | null;
  setSession: (data: {
    accessToken: string;
    refreshToken: string;
    user: UserSummary;
  }) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: UserSummary) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "cvp-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
