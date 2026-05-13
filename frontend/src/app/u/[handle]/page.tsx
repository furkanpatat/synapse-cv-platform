"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  Sparkles,
  Github,
  Linkedin,
  MapPin,
  Star,
  Briefcase,
  ArrowRight,
} from "lucide-react";

import { ScoreRing } from "@/components/ui/ScoreRing";
import { LandingNav } from "@/components/marketing/LandingNav";
import type { PublicProfileDto } from "@/types/public-profile";

const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function PublicProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<PublicProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    axios
      .get<PublicProfileDto>(`${PUBLIC_BASE}/v1/public/users/${handle}`)
      .then((r) => setProfile(r.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [handle]);

  if (loading) {
    return (
      <>
        <LandingNav />
        <div className="container-page py-20 text-center text-sm text-text-muted">
          Profil yükleniyor...
        </div>
      </>
    );
  }

  if (notFound || !profile) {
    return (
      <>
        <LandingNav />
        <div className="container-page py-24 text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">
            Bu profil bulunamadı
          </h1>
          <p className="mt-3 text-text-2">
            <code className="font-mono">/u/{handle}</code> sisteme kayıtlı değil
            veya gizli.
          </p>
          <Link href="/" className="btn btn--ai btn--lg mt-6 inline-flex">
            <Sparkles size={14} /> Synapse&apos;e dön
          </Link>
        </div>
      </>
    );
  }

  const fullName =
    `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() ||
    `@${profile.handle}`;
  const initials =
    ((profile.firstName?.[0] ?? "") + (profile.lastName?.[0] ?? "")).toUpperCase() ||
    profile.handle.slice(0, 2).toUpperCase();
  const score = profile.aiOverallScore;

  return (
    <>
      <LandingNav />

      <main>
        {/* Cover hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="bg-grid" />
          <div className="container-page py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <span
                    className="grid h-20 w-20 place-items-center rounded-2xl text-[28px] font-semibold text-white shadow-[0_24px_48px_-16px_hsla(218,92%,55%,0.4)]"
                    style={{
                      background:
                        "linear-gradient(135deg, #a855f7, #3b82f6, #22d3ee)",
                    }}
                  >
                    {initials}
                  </span>
                  <div>
                    <h1 className="text-[36px] font-semibold leading-tight tracking-[-0.03em]">
                      {fullName}
                    </h1>
                    <p className="mt-1 text-text-2">
                      {profile.title ?? "Synapse kullanıcısı"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.city && (
                    <span className="pill">
                      <MapPin size={11} /> {profile.city}
                    </span>
                  )}
                  {score != null && (
                    <span className="pill pill--ai">
                      <Sparkles size={11} /> AI doğrulandı · {score}
                    </span>
                  )}
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="pill hover:text-text"
                    >
                      <Github size={11} /> @{profile.githubUsername ?? profile.handle}
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="pill hover:text-text"
                    >
                      <Linkedin size={11} /> LinkedIn
                    </a>
                  )}
                </div>

                {profile.bio && (
                  <p className="mt-6 max-w-2xl text-[15px] leading-[1.65] text-text-2">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* AI score widget */}
              {score != null ? (
                <div className="score-widget mx-auto lg:mx-0">
                  <div className="score-widget__inner items-center text-center">
                    <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                      AI YETKİNLİK SKORU
                    </div>
                    <ScoreRing score={score} size="md" />
                    <p className="mt-3 max-w-[260px] text-[12.5px] leading-snug text-text-2">
                      CV beyanları GitHub aktivitesi ile doğrulanmıştır.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-8 text-center text-[13px] text-text-muted">
                  Henüz AI yetkinlik analizi yok.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="container-page py-12">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              {profile.aiSummary && (
                <div className="card--grad-border">
                  <div className="card__inner">
                    <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                      <Sparkles size={11} className="inline text-ai-2" /> AI ÖZETİ
                    </div>
                    <p className="text-[14.5px] leading-[1.65] text-text">
                      {profile.aiSummary}
                    </p>
                  </div>
                </div>
              )}

              {profile.cvSummary && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
                  <h3 className="mb-3 text-[13px] font-medium">📝 Hakkında</h3>
                  <p className="whitespace-pre-wrap text-[14.5px] leading-[1.65] text-text-2">
                    {profile.cvSummary}
                  </p>
                </div>
              )}

              {profile.skills.length > 0 && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
                  <h3 className="mb-3 text-[13px] font-medium">
                    🛠 Yetkinlikler ({profile.skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[12.5px] text-text-2"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              {profile.githubUsername && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium">
                    <Github size={14} className="text-text-muted" /> GitHub Durumu
                  </h3>
                  <dl className="space-y-2.5 text-[13px]">
                    <Row label="Kullanıcı" value={`@${profile.githubUsername}`} mono />
                    <Row label="Public repo" value={profile.publicRepos ?? "—"} mono />
                    <Row
                      label="Toplam yıldız"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Star size={11} className="text-amber-400" />{" "}
                          {profile.totalStars ?? "—"}
                        </span>
                      }
                    />
                  </dl>
                </div>
              )}

              <div className="rounded-[var(--radius-lg)] border border-ai-2/30 bg-surface p-6 text-center">
                <Sparkles size={18} className="mx-auto mb-2 text-ai-2" />
                <h3 className="font-medium">Sen de Synapse&apos;e katıl</h3>
                <p className="mt-1 text-[12.5px] text-text-2">
                  AI ile CV doğrulama, iş eşleştirme ve şirketlere görünürlük.
                </p>
                <Link href="/register" className="btn btn--ai btn--sm mt-4 inline-flex">
                  <Briefcase size={12} /> Ücretsiz başla <ArrowRight size={12} />
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className={mono ? "font-mono text-text" : "text-text"}>{value}</dd>
    </div>
  );
}
