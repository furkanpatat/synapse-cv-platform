"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Sparkles, Mail, Lock, Eye, EyeOff, Github } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/auth-api";
import { oauthApi, type OAuthProvider } from "@/lib/oauth-api";
import { useAuthStore } from "@/lib/auth-store";
import { redirectPathForRole } from "@/lib/redirect-by-role";
import type { ApiError } from "@/types/auth";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(1, "Şifre gerekli"),
  totpCode: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);

  const startOAuth = async (provider: OAuthProvider) => {
    setServerError(null);
    setOauthBusy(provider);
    try {
      const url = await oauthApi.start(provider);
      window.location.href = url;
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setServerError(
        e.response?.data?.message ??
          `${provider} ile giriş başlatılamadı — sağlayıcı yapılandırılmış mı?`
      );
      setOauthBusy(null);
    }
  };

  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await authApi.login(data);
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      router.replace(redirectPathForRole(res.user.role));
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      const code = e.response?.data?.code;
      if (code === "TOTP_REQUIRED") {
        setNeedsTotp(true);
        setServerError(null);
        return;
      }
      if (code === "TOTP_INVALID") {
        setServerError("İki adımlı doğrulama kodu hatalı. Tekrar dene.");
        return;
      }
      setServerError(e.response?.data?.message ?? "Giriş başarısız");
    }
  };

  return (
    <AuthShell
      quote={{
        text: "AI skorum mülakatta gerçek bir konuşma noktası oldu. Sözlerimi GitHub'ım destekledi.",
        name: "Zeynep Demir",
        role: "Frontend Developer · Getir",
        initials: "ZD",
      }}
      topRightLink={{ text: "Hesabın yok mu?", label: "Kayıt ol", href: "/register" }}
    >
      <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        <Sparkles size={12} className="text-ai-2" />
        Hoş geldin
      </div>
      <h1 className="text-[clamp(28px,3.5vw,36px)] font-semibold leading-[1.1] tracking-[-0.035em]">
        Hesabına <span className="ai-text">giriş yap</span>
      </h1>
      <p className="mb-7 mt-2 max-w-[380px] text-[14.5px] text-text-2">
        AI yetkinlik skoruna ulaşmak için devam et.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="social-btn disabled:opacity-60"
          onClick={() => startOAuth("google")}
          disabled={oauthBusy !== null}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          {oauthBusy === "google" ? "Yönlendiriliyor..." : "Google"}
        </button>
        <button
          type="button"
          className="social-btn disabled:opacity-60"
          onClick={() => startOAuth("github")}
          disabled={oauthBusy !== null}
        >
          <Github size={16} />
          {oauthBusy === "github" ? "Yönlendiriliyor..." : "GitHub"}
        </button>
      </div>

      <div className="auth-divider my-5">YA DA</div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <Field
          label="E-POSTA"
          type="email"
          autoComplete="email"
          placeholder="ornek@email.com"
          icon={<Mail size={15} />}
          error={formState.errors.email?.message}
          {...register("email")}
        />
        <Field
          label="ŞİFRE"
          type={showPwd ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock size={15} />}
          suffix={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="text-text-muted hover:text-text"
              aria-label="Şifreyi göster"
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={formState.errors.password?.message}
          {...register("password")}
        />

        {needsTotp && (
          <div className="rounded-md border border-ai-2/30 bg-ai-2/5 p-3">
            <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ai-2">
              <Sparkles size={11} className="inline" /> İki adımlı doğrulama
            </div>
            <p className="mb-2 text-[12.5px] text-text-2">
              Authenticator uygulamandaki 6 haneli kodu gir.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              placeholder="123456"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:border-text focus:outline-none"
              {...register("totpCode")}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-[12.5px]">
          <label className="cbox">
            <input type="checkbox" defaultChecked />
            <span className="cbox__box">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12l5 5L20 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Beni hatırla
          </label>
          <Link
            href="/forgot-password"
            className="border-b border-border-strong pb-px text-text"
          >
            Şifremi unuttum
          </Link>
        </div>

        {serverError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          variant="ai"
          size="lg"
          loading={formState.isSubmitting}
          className="mt-2 w-full"
        >
          <Sparkles size={15} /> Giriş yap
        </Button>
      </form>
    </AuthShell>
  );
}
