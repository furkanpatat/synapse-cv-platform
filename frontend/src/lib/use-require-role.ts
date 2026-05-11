"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./auth-store";
import type { Role } from "@/types/auth";

export function useRequireRole(role: Role) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      const dest =
        user.role === "COMPANY"
          ? "/company"
          : user.role === "ADMIN"
            ? "/admin"
            : "/dashboard";
      router.replace(dest);
    }
  }, [hydrated, token, user, role, router]);

  return { ready: hydrated && !!user && user.role === role, user };
}
