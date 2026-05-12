"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Sparkles, ArrowRight } from "lucide-react";

import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

type Status = "verifying" | "success" | "error" | "idle";

function Inner() {
  const params = useSearchParams();
  const token = params.get("token");
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(42);

  // Verify if token present
  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("E-posta adresin başarıyla doğrulandı. Artık her yere erişebilirsin.");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Token geçersiz veya süresi dolmuş. Yeni bir doğrulama maili iste.");
      });
  }, [token]);

  // Resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const email = user?.email ?? "your@email.com";

  const title =
    status === "success"
      ? "Hesabın doğrulandı"
      : status === "error"
        ? "Doğrulama başarısız"
        : status === "verifying"
          ? "Doğrulanıyor..."
          : "E-postanı doğrula";

  const sub =
    message ||
    (status === "idle"
      ? `${email} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıklayarak hesabını aktive et.`
      : "");

  return (
    <div className="grid min-h-screen place-items-center p-10 [background:radial-gradient(ellipse_60%_50%_at_50%_30%,hsla(280,70%,30%,0.3),transparent_60%),radial-gradient(ellipse_50%_40%_at_50%_80%,hsla(190,70%,30%,0.3),transparent_60%),var(--bg)]">
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium tracking-tight"
      >
        <span className="grid h-7 w-7 place-items-center rounded-[9px] ai-grad">
          <Sparkles size={14} className="text-white" />
        </span>
        Synapse
      </Link>

      <div className="verify-card">
        <div className="verify-card__inner">
          <div className="verify-orb-mail">
            <Mail size={32} />
          </div>

          <h1 className="text-[26px] font-semibold tracking-[-0.03em]">
            {status === "success" ? (
              <>
                Hesabın <span className="ai-text">doğrulandı</span>
              </>
            ) : (
              title
            )}
          </h1>
          <p className="mx-auto mb-6 mt-2 max-w-[360px] text-[14.5px] leading-[1.55] text-text-2">
            {sub}
          </p>

          {status !== "success" && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-[10px] border border-border bg-surface-2 px-3.5 py-2.5 font-mono text-[13px]">
              <Mail size={14} className="text-text-muted" />
              {email}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {status === "success" ? (
              <Link
                href="/dashboard"
                className="btn btn--ai btn--lg w-full"
              >
                <Sparkles size={15} /> Panele git <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--ai btn--lg w-full"
                >
                  <Mail size={15} /> Gelen kutusuna git
                </a>
                <Link href="/register" className="btn btn--outline w-full">
                  Farklı e-posta kullan
                </Link>
              </>
            )}
          </div>

          {status !== "success" && (
            <p className="mt-4 text-[12.5px] text-text-muted">
              Mail gelmediyse{" "}
              {cooldown > 0 ? (
                <span className="font-mono">tekrar gönder ({String(cooldown).padStart(2, "0")}:00)</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setCooldown(42)}
                  className="border-b border-border-strong pb-px text-text"
                >
                  tekrar gönder
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-text-muted">Yükleniyor...</p>}>
      <Inner />
    </Suspense>
  );
}
