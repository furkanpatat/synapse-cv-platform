"use client";

/**
 * Cookie consent banner — KVKK / ePrivacy-aware.
 *
 * Scope: we only set strictly-necessary cookies (JWT refresh, theme) plus
 * an opt-in `analytics` bucket. The banner stores the choice in
 * localStorage under `synapse.consent` so it doesn't re-prompt on every
 * page load. No network call, no third-party SDK — keeps the banner from
 * being the very thing it warns about.
 *
 * Why localStorage and not a cookie: the banner runs only client-side
 * and the choice doesn't need to be readable by the server. If we ever
 * add server-rendered personalization we'll mirror it to a cookie.
 */

import { useEffect, useState } from "react";

type Consent = "accepted" | "rejected" | null;

const KEY = "synapse.consent";

function readConsent(): Consent {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "accepted" || v === "rejected" ? v : null;
}

export function CookieConsent() {
  const [choice, setChoice] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe: read storage only after mount so SSR + CSR match.
  useEffect(() => {
    setMounted(true);
    setChoice(readConsent());
  }, []);

  const decide = (next: "accepted" | "rejected") => {
    window.localStorage.setItem(KEY, next);
    setChoice(next);
  };

  if (!mounted || choice !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihleri"
      className="fixed bottom-4 left-1/2 z-50 w-[min(calc(100%-2rem),720px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[var(--surface)] p-4 shadow-2xl backdrop-blur"
    >
      <p className="text-sm text-[var(--text-2)]">
        Synapse, oturum açma ve tema gibi <strong>zorunlu</strong> çerezleri
        kullanır. İsteğe bağlı olarak hata izleme ve kullanım istatistikleri
        için anonim analiz çerezlerini açabilirsiniz. Detay için{" "}
        <a
          href="/legal/kvkk"
          className="underline decoration-dotted underline-offset-2 hover:text-white"
        >
          KVKK aydınlatma metnimize
        </a>{" "}
        bakın.
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => decide("rejected")}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-[var(--text-2)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-2)]"
        >
          Sadece zorunlu
        </button>
        <button
          type="button"
          onClick={() => decide("accepted")}
          className="rounded-lg bg-gradient-to-r from-[var(--ai-1)] to-[var(--ai-2)] px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-3)]"
        >
          Tümünü kabul et
        </button>
      </div>
    </div>
  );
}

/** Read-only helper for analytics gates. Returns false until the user opts in. */
export function hasAnalyticsConsent(): boolean {
  return readConsent() === "accepted";
}
