/**
 * Site-wide footer. Lives outside the Nav so unauthenticated pages get
 * the same legal links as the dashboard. Pure server component — no
 * client JS needed.
 */
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[var(--bg)] px-6 py-8 text-sm text-[var(--text-muted)]">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="font-semibold text-[var(--text-2)]">Synapse</span>
          <span className="ml-2">© {new Date().getFullYear()} · Bitirme projesi (SDÜ)</span>
        </div>
        <nav aria-label="Yasal bağlantılar" className="flex flex-wrap gap-4">
          <Link href="/legal/kvkk" className="hover:text-white">KVKK</Link>
          <Link href="/legal/privacy" className="hover:text-white">Gizlilik</Link>
          <Link href="/legal/terms" className="hover:text-white">Kullanım Şartları</Link>
          <a
            href="https://github.com/furkanpatat/synapse-cv-platform"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
