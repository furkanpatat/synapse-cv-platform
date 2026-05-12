"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Camera,
  Check,
  Building2,
  Globe,
  Hash,
  Layers,
  Image as ImageIcon,
  Clock,
} from "lucide-react";

import { companyApi } from "@/lib/company-api";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { ApiError } from "@/types/auth";
import type { CompanyResponse } from "@/types/jobs";

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    companyApi
      .getMyCompany()
      .then(setCompany)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Şirket bilgisi yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!company) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await companyApi.updateMyCompany({
        name: (fd.get("name") as string) || undefined,
        taxNo: (fd.get("taxNo") as string) || undefined,
        sector: (fd.get("sector") as string) || undefined,
        website: (fd.get("website") as string) || undefined,
        logoUrl: (fd.get("logoUrl") as string) || undefined,
        description: (fd.get("description") as string) || undefined,
      });
      setCompany(updated);
      setSuccess("Şirket profili güncellendi");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!company) {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
        {error ?? "Şirket bulunamadı"}
      </div>
    );
  }

  const initials = company.name.charAt(0).toUpperCase();
  const completion = computeCompletion(company);

  return (
    <form onSubmit={handleSubmit}>
      {/* Cover + logo hero */}
      <div className="relative mb-[88px] overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <div
          className="h-[180px] w-full"
          style={{
            background:
              "linear-gradient(110deg, hsl(280 88% 50%), hsl(218 92% 50%), hsl(190 85% 45%))",
          }}
        />
        <div className="absolute right-5 top-5">
          <Button type="submit" variant="ai" loading={saving}>
            <Check size={14} /> Kaydet
          </Button>
        </div>

        <div className="absolute left-7 top-[116px]">
          <div className="relative">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-32 w-32 rounded-2xl object-cover"
                style={{ outline: "4px solid var(--bg)" }}
              />
            ) : (
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
            )}
            <button
              type="button"
              className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-text hover:bg-surface-2"
              aria-label="Logo değiştir"
            >
              <Camera size={14} />
            </button>
          </div>
        </div>

        <div className="px-[180px] pb-6 pt-4">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
            {company.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-text-2">
            {company.sector && <span>{company.sector}</span>}
            {company.sector && company.website && (
              <span className="text-text-muted">·</span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-text"
              >
                <Globe size={12} /> {stripUrl(company.website)}
              </a>
            )}
            <span
              className={`pill ${company.verified ? "pill--success" : "pill--warning"}`}
              style={{ fontSize: 11 }}
            >
              {company.verified ? (
                <>
                  <Check size={11} /> Onaylı şirket
                </>
              ) : (
                <>
                  <Clock size={11} /> Onay bekliyor
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium">
              <Building2 size={14} className="text-text-muted" /> Şirket bilgileri
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="ŞİRKET ADI"
                name="name"
                defaultValue={company.name}
                icon={<Building2 size={14} />}
              />
              <Field
                label="VERGİ NO"
                name="taxNo"
                defaultValue={company.taxNo ?? ""}
                icon={<Hash size={14} />}
              />
              <Field
                label="SEKTÖR"
                name="sector"
                defaultValue={company.sector ?? ""}
                placeholder="Yazılım"
                icon={<Layers size={14} />}
              />
              <Field
                label="WEB SİTESİ"
                name="website"
                defaultValue={company.website ?? ""}
                placeholder="https://..."
                icon={<Globe size={14} />}
              />
            </div>

            <div className="mt-4">
              <Field
                label="LOGO URL"
                name="logoUrl"
                defaultValue={company.logoUrl ?? ""}
                placeholder="https://... (kare PNG/JPG önerilir)"
                icon={<ImageIcon size={14} />}
              />
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <h3 className="mb-3 text-[13px] font-medium">📝 Hakkımızda</h3>
            <div className="space-y-1">
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                ŞİRKET TANITIMI
              </span>
              <textarea
                name="description"
                rows={6}
                defaultValue={company.description ?? ""}
                placeholder="Şirketinizin kısa hikayesi — adaylar bu metni görür."
                className="block w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-text focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
              />
            </div>
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

        {/* RIGHT sticky */}
        <aside className="space-y-5">
          <div className="lg:sticky lg:top-6 space-y-5">
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
                    <span
                      className={
                        it.done ? "line-through text-text-muted" : ""
                      }
                    >
                      {it.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium">
                <Check size={14} className="text-text-muted" /> Doğrulama
              </h3>
              <p className="text-[13px] text-text-2 leading-snug">
                {company.verified ? (
                  <>
                    Şirket hesabın <b className="text-emerald-400">onaylı</b>.
                    Aktif ilan yayınlayabilirsin.
                  </>
                ) : (
                  <>
                    Şirket hesabın admin onayı bekliyor. Onay alana kadar ilan
                    yayınlayamazsın.
                  </>
                )}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

function stripUrl(u: string) {
  return u.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function computeCompletion(c: CompanyResponse) {
  const items = [
    { label: "Şirket adı", done: !!c.name },
    { label: "Vergi numarası", done: !!c.taxNo },
    { label: "Sektör seçildi", done: !!c.sector },
    { label: "Web sitesi", done: !!c.website },
    { label: "Logo eklendi", done: !!c.logoUrl },
    { label: "Tanıtım metni", done: !!c.description && c.description.length > 30 },
    { label: "Admin onayı", done: c.verified },
  ];
  const done = items.filter((i) => i.done).length;
  const score = Math.round((done / items.length) * 100);
  return { score, items };
}
