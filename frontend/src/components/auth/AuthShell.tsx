"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthOrb } from "./AuthOrb";

interface Props {
  children: React.ReactNode;
  quote?: {
    text: string;
    name: string;
    role: string;
    initials: string;
  };
  topRightLink?: {
    text: string;
    label: string;
    href: string;
  };
}

const DEFAULT_QUOTE = {
  text: "GitHub aktivitemi gerçek bir skora dönüştüren ilk araç. Mülakatlarda kanıt sunmak hiç bu kadar kolay olmamıştı.",
  name: "Ahmet Kara",
  role: "Senior Backend Eng · Trendyol",
  initials: "AK",
};

export function AuthShell({ children, quote = DEFAULT_QUOTE, topRightLink }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT — decorative */}
      <aside className="auth-left hidden lg:flex">
        <Link href="/" className="relative z-10 inline-flex items-center gap-2.5 text-base font-medium tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] ai-grad">
            <Sparkles size={16} className="text-white" />
          </span>
          Synapse
        </Link>

        <div className="relative z-10 flex flex-1 items-center justify-center">
          <AuthOrb />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-4 h-[2px] w-6 bg-gradient-to-r from-ai-1 to-ai-3" />
          <p className="mb-4 text-[18px] leading-[1.55] tracking-[-0.015em] text-white/90">
            “{quote.text}”
          </p>
          <div className="flex items-center gap-3 font-mono text-xs tracking-wider text-white/55">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-red-500 text-[12px] font-semibold text-white">
              {quote.initials}
            </span>
            <span>
              {quote.name} · {quote.role}
            </span>
          </div>
        </div>
      </aside>

      {/* RIGHT — form */}
      <main className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-[6vw]">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-medium tracking-tight lg:hidden"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[9px] ai-grad">
              <Sparkles size={16} className="text-white" />
            </span>
            Synapse
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {topRightLink && (
              <span className="text-[13.5px] text-text-2">
                {topRightLink.text}{" "}
                <Link
                  href={topRightLink.href}
                  className="ml-1.5 border-b border-border-strong pb-px font-medium text-text"
                >
                  {topRightLink.label}
                </Link>
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>

        <div className="m-auto w-full max-w-[440px]">{children}</div>

        <footer className="mt-12 flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted sm:flex-row sm:justify-between">
          <span>© 2026 SYNAPSE</span>
          <span>v0.1 · SDÜ Bitirme</span>
        </footer>
      </main>
    </div>
  );
}
