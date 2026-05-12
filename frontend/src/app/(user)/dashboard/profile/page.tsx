"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { User, Github, Linkedin, MapPin, Briefcase, Check } from "lucide-react";

import { authApi } from "@/lib/auth-api";
import { userApi } from "@/lib/user-api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { ApiError, MeResponse } from "@/types/auth";

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    authApi
      .me()
      .then(setMe)
      .finally(() => setLoading(false));
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

  const initials = ((me.firstName?.[0] ?? "") + (me.lastName?.[0] ?? "")).toUpperCase() || "U";
  const fullName = `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim() || me.email;
  const completion = computeCompletion(me);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <User size={12} /> PROFİL
          </div>
          <h1 className="page-head__title">
            <span className="ai-text">Profilini</span> tamamla
          </h1>
          <p className="page-head__sub mt-1.5">
            GitHub bağlantın AI analiz için gerekli, profil tamamlığı şirketlerin görünürlüğünü etkiler.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT — form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Identity card */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <div className="mb-6 flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-2xl text-[22px] font-semibold text-white ai-grad shadow-[0_24px_48px_-16px_hsla(218,92%,55%,0.4)]">
                {initials}
              </span>
              <div>
                <div className="text-[18px] font-semibold tracking-[-0.025em]">
                  {fullName}
                </div>
                <div className="font-mono text-[12px] text-text-muted">{me.email}</div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="AD" name="firstName" defaultValue={me.firstName ?? ""} />
              <Field label="SOYAD" name="lastName" defaultValue={me.lastName ?? ""} />
              <Field
                label="ŞEHİR"
                name="city"
                defaultValue={me.city ?? ""}
                icon={<MapPin size={14} />}
              />
              <Field
                label="ÜNVAN"
                name="title"
                defaultValue={me.title ?? ""}
                icon={<Briefcase size={14} />}
                placeholder="Frontend Engineer"
              />
            </div>

            <div className="mt-4 space-y-1.5">
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-text-muted font-mono">
                HAKKIMDA
              </span>
              <textarea
                name="bio"
                rows={4}
                defaultValue={me.bio ?? ""}
                placeholder="Kısa profil tanıtımı..."
                className="block w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-text focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
              />
            </div>
          </div>

          {/* Social links */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium">
              <Github size={14} className="text-text-muted" /> Sosyal bağlantılar
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="GITHUB URL VEYA KULLANICI ADI"
                name="githubUrl"
                defaultValue={me.githubUrl ?? ""}
                placeholder="https://github.com/kullanici"
                icon={<Github size={14} />}
              />
              <Field
                label="LINKEDIN URL"
                name="linkedinUrl"
                defaultValue={me.linkedinUrl ?? ""}
                placeholder="https://linkedin.com/in/kullanici"
                icon={<Linkedin size={14} />}
              />
            </div>
            {me.githubUrl && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] text-emerald-300">
                <Check size={12} /> GitHub bağlandı — AI analiz hazır
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

          <Button type="submit" variant="ai" size="lg" loading={saving}>
            Değişiklikleri kaydet
          </Button>
        </form>

        {/* RIGHT — sticky completion */}
        <aside className="space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 lg:sticky lg:top-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              PROFİL TAMAMLIĞI
            </div>
            <div className="mt-2 mb-4 flex items-baseline gap-1">
              <span className="text-[44px] font-semibold tracking-[-0.04em] ai-text">
                %{completion.score}
              </span>
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
                  <span className={it.done ? "" : "text-text-muted"}>{it.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function computeCompletion(me: MeResponse) {
  const items = [
    { label: "Ad / soyad eklendi", done: !!me.firstName && !!me.lastName },
    { label: "E-posta doğrulandı", done: me.emailVerified },
    { label: "Şehir + ünvan", done: !!me.city && !!me.title },
    { label: "Hakkımda yazıldı", done: !!me.bio && me.bio.length > 20 },
    { label: "GitHub bağlandı", done: !!me.githubUrl },
    { label: "LinkedIn eklendi", done: !!me.linkedinUrl },
  ];
  const done = items.filter((i) => i.done).length;
  const score = Math.round((done / items.length) * 100);
  return { score, items };
}
