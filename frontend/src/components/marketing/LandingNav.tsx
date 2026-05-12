"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 h-16 backdrop-blur-xl border-b border-border bg-[color-mix(in_oklab,var(--bg)_78%,transparent)]">
      <div className="container-page flex h-full items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-lg ai-grad">
            <Sparkles size={14} className="relative z-10 text-white" />
          </span>
          Synapse
        </Link>

        <nav className="hidden md:flex gap-1 text-sm text-text-2">
          <a className="rounded-lg px-3 py-2 hover:bg-surface-2 hover:text-text transition" href="#features">
            Özellikler
          </a>
          <a className="rounded-lg px-3 py-2 hover:bg-surface-2 hover:text-text transition" href="#how">
            Nasıl çalışır
          </a>
          <a className="rounded-lg px-3 py-2 hover:bg-surface-2 hover:text-text transition" href="#pricing">
            Fiyatlandırma
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn btn--ghost btn--sm">
            Giriş yap
          </Link>
          <Link href="/register" className="btn btn--ai btn--sm">
            <Sparkles size={14} /> Başla
          </Link>
        </div>
      </div>
    </header>
  );
}
