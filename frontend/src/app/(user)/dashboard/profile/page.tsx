"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import {
  Camera,
  Check,
  Github,
  Linkedin,
  MapPin,
  Sparkles,
  RefreshCcw,
} from "lucide-react";

import { authApi } from "@/lib/auth-api";
import { userApi } from "@/lib/user-api";
import { analysisApi } from "@/lib/analysis-api";
import { aiApi } from "@/lib/ai-api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { AiText } from "@/components/ai/AiText";
import type { ApiError, MeResponse } from "@/types/auth";
import type { AnalysisReport } from "@/types/analysis";

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [aiBioText, setAiBioText] = useState<string | null>(null);
  const [aiBioError, setAiBioError] = useState<string | null>(null);

  const handleGenerateBio = async () => {
    setAiBioError(null);
    setAiBioText("");
    setGeneratingBio(true);
    try {
      const text = await aiApi.bio();
      setAiBioText(text);
      if (bioRef.current) bioRef.current.value = text;
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setAiBioError(
        e.response?.data?.message ?? "AI bio üretilemedi. Önce CV yükle ve analiz çalıştır."
      );
    } finally {
      setGeneratingBio(false);
    }
  };

  useEffect(() => {
    authApi
      .me()
      .then(setMe)
      .finally(() => setLoading(false));
    analysisApi.me().then(setAnalysis).catch(() => setAnalysis(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!me) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await userApi.updateProfile({
        firstName: (fd.get("firstName") as string) || undefined,
        lastName: (fd.get("lastName") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        title: (fd.get("title") as string) || undefined,
        bio: (fd.get("bio") as string) || undefined,
        githubUrl: (fd.get("githubUrl") as string) || undefined,
        linkedinUrl: (fd.get("linkedinUrl") as string) || undefined,
      });
      setMe(updated);
      setUser({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        emailVerified: updated.emailVerified,
      });
      setSuccess("Profil güncellendi");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!me) return null;

  const initials =
    ((me.firstName?.[0] ?? "") + (me.lastName?.[0] ?? "")).toUpperCase() || "U";
  const fullName = `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim() || me.email;
  const completion = computeCompletion(me);
  const githubUsername = extractGithub(me.githubUrl);

  return (
    <form onSubmit={handleSubmit}>
      {/* COVER + AVATAR HERO */}
      <div className="relative mb-[88px] overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <div
          className="h-[180px] w-full"
          style={{
            background:
              "linear-gradient(110deg, hsl(280 88% 50%), hsl(218 92% 50%), hsl(190 85% 45%))",
          }}
        />
        <div className="absolute right-5 top-5 flex gap-2">
          <Button type="submit" variant="ai" loading={saving}>
            <Check size={14} /> Kaydet
          </Button>
        </div>

        {/* avatar overlapping */}
        <div className="absolute left-7 top-[116px]">
          <div className="relative">
            <span
              className="grid h-32 w-32 place-items-center rounded-2xl text-[44px] font-semibold text-white shadow-[0_24px_48px_-16px_rgba(0,0,0,0.4)]"
              style={{
                background:
                  "linear-gradient(135deg, #a855f7, #3b82f6, #22d3ee)",
                outline: "4px solid var(--bg)",
              }}
            >
              {initials}
            </span>
            <button
              type="button"
              className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-text hover:bg-surface-2"
              aria-label="Avatar değiştir"
            >
              <Camera size={14} />
            </button>
          </div>
        </div>

        {/* name beside avatar */}
        <div className="px-[180px] pb-6 pt-4">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
            {fullName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-text-2">
            {me.title && <span>{me.title}</span>}
            {me.title && me.city && <span className="text-text-muted">·</span>}
            {me.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {me.city}
              </span>
            )}
            {analysis && (
              <span className="pill pill--ai" style={{ fontSize: 11 }}>
                <Sparkles size={11} /> AI doğrulandı · {analysis.overallScore}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Kişisel bilgiler */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium">
              <span className="text-text-muted">👤</span> Kişisel bilgiler
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="AD" name="firstName" defaultValue={me.firstName ?? ""} />
              <Field label="SOYAD" name="lastName" defaultValue={me.lastName ?? ""} />
              <Field
                label="E-POSTA"
                name="email"
                defaultValue={me.email}
                disabled
              />
              <Field
                label="ŞEHİR"
                name="city"
                defaultValue={me.city ?? ""}
                icon={<MapPin size={14} />}
                placeholder="İstanbul"
              />
              <Field
                label="ÜNVAN"
                name="title"
                defaultValue={me.title ?? ""}
                placeholder="Senior Frontend Engineer"
              />
              <Field
                label="LINKEDIN URL"
                name="linkedinUrl"
                defaultValue={me.linkedinUrl ?? ""}
                placeholder="https://linkedin.com/in/..."
                icon={<Linkedin size={14} />}
              />
            </div>
          </div>

          {/* Hakkımda */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-medium">📝 Hakkımda</h3>
              <button
                type="button"
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="pill pill--ai disabled:opacity-60 hover:brightness-110"
                style={{ fontSize: 11, cursor: "pointer" }}
              >
                <Sparkles size={11} />
                {generatingBio ? "AI yazıyor..." : "AI ile yaz"}
              </button>
            </div>
            <div className="space-y-1">
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                KISA BİYOGRAFİ
              </span>
              <textarea
                ref={bioRef}
                name="bio"
                rows={5}
                defaultValue={me.bio ?? ""}
                placeholder="Profilinin ilk gördüğü satır — kısa ve net olsun."
                className="block w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-text focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
              />
              {aiBioText !== null && (
                <div className="mt-2 rounded-md border border-ai-2/30 bg-ai-2/5 p-3 text-[13px] text-text-2">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                    <Sparkles size={10} className="inline" /> AI önerisi (yukarıya
                    eklendi — düzenleyebilirsin)
                  </div>
                  <AiText text={aiBioText} />
                </div>
              )}
              {aiBioError && (
                <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
                  {aiBioError}
                </div>
              )}
            </div>
          </div>

          {/* GitHub */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium">
              <Github size={14} className="text-text-muted" /> GitHub bağlantısı
            </h3>
            <Field
              label="GITHUB URL VEYA KULLANICI ADI"
              name="githubUrl"
              defaultValue={me.githubUrl ?? ""}
              placeholder="https://github.com/kullanici"
              icon={<Github size={14} />}
            />
            {githubUsername && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] text-emerald-300">
                <Check size={12} /> @{githubUsername} bağlandı — AI analiz hazır
              </div>
            )}
          </div>

          {success && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* RIGHT — sticky completion + github status */}
        <aside className="space-y-5">
          <div className="lg:sticky lg:top-6 space-y-5">
            {/* Completion */}
            <div className="rounded-[var(--radius-lg)] border border-ai-2/30 bg-surface p-6">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                PROFİL TAMAMLANMA
              </div>
              <div className="mt-2 mb-4 text-[44px] font-semibold leading-none tracking-[-0.04em] ai-text">
                %{completion.score}
              </div>
              <div className="usage__track mb-5">
                <div
                  className="usage__fill usage__fill--ai"
                  style={{ width: `${completion.score}%` }}
                />
              </div>
              <ul className="space-y-2.5 text-[13px]">
                {completion.items.map((it) => (
                  <li key={it.label} className="flex items-center gap-2">
                    {it.done ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-text-muted">
                        <span className="h-1 w-1 rounded-full bg-text-muted" />
                      </span>
                    )}
                    <span className={it.done ? "line-through text-text-muted" : ""}>
                      {it.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* GitHub status */}
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
              <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium">
                <Github size={14} className="text-text-muted" /> GitHub durumu
              </h3>
              <dl className="space-y-2.5 text-[13px]">
                <Row label="Hesap" value={githubUsername ? `@${githubUsername}` : "—"} mono />
                <Row
                  label="Public repo"
                  value={analysis?.github?.publicRepos ?? "—"}
                  mono
                />
                <Row
                  label="Toplam yıldız"
                  value={analysis?.github?.totalStars ?? "—"}
                  mono
                />
                <Row
                  label="Doğrulama"
                  value={
                    analysis ? (
                      <span className="text-emerald-400">✓ DOĞRULANDI</span>
                    ) : (
                      "—"
                    )
                  }
                />
              </dl>
              <Link
                href="/dashboard/analysis"
                className="btn btn--outline btn--sm mt-4 w-full"
              >
                <RefreshCcw size={12} /> Yeniden senkronize et
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </form>
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

function extractGithub(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const m = trimmed.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9-]+$/.test(trimmed)) return trimmed;
  return null;
}

function computeCompletion(me: MeResponse) {
  const items = [
    { label: "Temel bilgiler", done: !!me.firstName && !!me.lastName },
    { label: "Profil fotoğrafı", done: false },
    { label: "Hakkımda metni", done: !!me.bio && me.bio.length > 20 },
    { label: "İş deneyimi (CV)", done: !!me.title },
    { label: "Sosyal linker", done: !!me.linkedinUrl },
    { label: "GitHub bağla", done: !!me.githubUrl },
    { label: "Beceri etiketleri ekle", done: false },
  ];
  const done = items.filter((i) => i.done).length;
  const score = Math.round((done / items.length) * 100);
  return { score, items };
}
