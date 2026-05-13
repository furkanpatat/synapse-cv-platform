"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import { redirectPathForRole } from "@/lib/redirect-by-role";

export default function OAuthFinishPage() {
  return (
    <Suspense fallback={<Shell>Bağlantı tamamlanıyor...</Shell>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const err = params.get("error");

    if (err) {
      setError(decodeURIComponent(err));
      return;
    }
    if (!accessToken || !refreshToken) {
      setError("Eksik token — OAuth akışı tamamlanamadı.");
      return;
    }

    // Stash tokens so /v1/auth/me request auths correctly.
    setSession({
      accessToken,
      refreshToken,
      user: {
        id: "",
        email: params.get("email") ?? "",
        firstName: "",
        lastName: "",
        role: (params.get("role") as "USER" | "COMPANY" | "ADMIN") ?? "USER",
        emailVerified: true,
      },
    });

    // Pull the full user record so the rest of the app has names/avatar/etc.
    authApi
      .me()
      .then((me) => {
        setSession({
          accessToken,
          refreshToken,
          user: {
            id: me.id,
            email: me.email,
            firstName: me.firstName ?? "",
            lastName: me.lastName ?? "",
            role: me.role,
            emailVerified: me.emailVerified ?? true,
          },
        });
        router.replace(redirectPathForRole(me.role));
      })
      .catch(() => {
        // Fall back to whatever the role param gave us.
        router.replace(
          redirectPathForRole((params.get("role") as "USER" | "COMPANY" | "ADMIN") ?? "USER")
        );
      });
  }, [params, router, setSession]);

  if (error) {
    return (
      <Shell>
        <div className="space-y-3">
          <p className="text-red-300">OAuth giriş başarısız: {error}</p>
          <Link href="/login" className="btn btn--outline btn--sm inline-flex">
            Giriş sayfasına dön
          </Link>
        </div>
      </Shell>
    );
  }
  return (
    <Shell>
      <Sparkles size={18} className="inline text-ai-2" /> Hesabın hazırlanıyor...
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-bg p-6">
      <div className="max-w-md text-center text-text-2">{children}</div>
    </main>
  );
}
