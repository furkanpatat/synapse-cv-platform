"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Calendar,
  Bookmark,
  Share2,
  Check,
  DollarSign,
  Clock,
  Lock,
} from "lucide-react";

import { userJobsApi } from "@/lib/jobs-user-api";
import { analysisApi } from "@/lib/analysis-api";
import { billingApi } from "@/lib/billing-api";
import { QuotaBanner } from "@/components/QuotaBanner";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { ApiError } from "@/types/auth";
import type { JobResponse } from "@/types/jobs";
import type { AnalysisReport } from "@/types/analysis";
import type { BillingMeResponse } from "@/types/billing";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [billing, setBilling] = useState<BillingMeResponse | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [showCover, setShowCover] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  useEffect(() => {
    userJobsApi
      .get(id)
      .then(setJob)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "İlan yüklenemedi");
      })
      .finally(() => setLoading(false));
    analysisApi.me().then(setAnalysis).catch(() => setAnalysis(null));
    billingApi.me().then(setBilling).catch(() => setBilling(null));
  }, [id]);

  const mySkillsList = analysis?.skillScores ?? [];
  const mySkillsMap = new Map(mySkillsList.map((s) => [s.skill.toLowerCase(), s]));
  const required = job?.requiredSkills ?? [];
  const matched = required.filter((s) => mySkillsMap.has(s.toLowerCase()));
  const matchPct = required.length
    ? Math.round((matched.length / required.length) * 100)
    : analysis?.overallScore ?? 0;

  const verdict =
    matchPct >= 80
      ? "Güçlü eşleşme"
      : matchPct >= 60
        ? "İyi eşleşme"
        : matchPct >= 40
          ? "Orta düzey"
          : "Zayıf eşleşme";

  const handleApply = async () => {
    setError(null);
    setQuotaMessage(null);
    setApplying(true);
    try {
      await userJobsApi.apply(id, coverLetter || undefined);
      setApplied(true);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      if (e.response?.data?.code === "ALREADY_APPLIED") {
        setApplied(true);
      } else if (e.response?.status === 402) {
        setQuotaMessage(
          e.response?.data?.message ?? "Aktif başvuru kotanı aştın."
        );
      } else {
        setError(e.response?.data?.message ?? "Başvuru başarısız");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!job) return <div className="text-red-400">{error}</div>;

  const initials = job.companyName.charAt(0).toUpperCase();
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];
  const color = colors[job.companyName.charCodeAt(0) % colors.length];
  const daysAgo = Math.max(
    1,
    Math.round((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <>
      <Link
        href="/dashboard/jobs"
        className="mb-5 inline-flex items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-text-2 hover:text-text"
      >
        <ArrowLeft size={13} /> İLANLARA DÖN
      </Link>

      {/* Company / role hero */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7 mb-5">
        <div className="flex flex-wrap items-start gap-5">
          <span
            className="grid h-14 w-14 place-items-center rounded-2xl text-[22px] font-semibold text-white shrink-0"
            style={{ background: color }}
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[12px] text-text-muted tracking-wide">
              {job.companyName}
              <span className="mx-2 text-border">·</span>
              Şirket
            </div>
            <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-[-0.03em]">
              {job.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="pill">
                <MapPin size={11} />{" "}
                {job.remoteType === "REMOTE"
                  ? "Remote · " + (job.city ?? "Türkiye")
                  : `${job.city ?? "—"}`}
              </span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="pill">
                  <DollarSign size={11} />{" "}
                  {[job.salaryMin, job.salaryMax].filter(Boolean).join("–")}{" "}
                  {job.currency} · brüt
                </span>
              )}
              <span className="pill">
                <Clock size={11} /> Full-time
              </span>
              <span className="pill">
                <Calendar size={11} /> {daysAgo} gün önce
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn btn--outline btn--sm" type="button">
                <Bookmark size={12} /> Kaydet
              </button>
              <button className="btn btn--ghost btn--sm" type="button">
                <Share2 size={12} /> Paylaş
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              ROL HAKKINDA
            </div>
            <div className="whitespace-pre-wrap text-[14.5px] leading-[1.65] text-text-2">
              {job.description}
            </div>
          </div>

          {required.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                ARADIĞIMIZ PROFİL
              </div>
              <ul className="space-y-2 text-[14px]">
                {required.map((s) => {
                  const have = mySkillsMap.has(s.toLowerCase());
                  return (
                    <li key={s} className="flex items-center gap-2">
                      <Check
                        size={14}
                        className={have ? "text-emerald-400" : "text-text-muted"}
                      />
                      <span className={have ? "" : "text-text-2"}>{s}</span>
                      {have && (
                        <span className="ml-auto font-mono text-[11px] text-emerald-400">
                          ✓ sende var
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT — sticky apply card */}
        <aside>
          <div className="apply-card">
            <div className="apply-card__inner space-y-5">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <ScoreRing score={matchPct} size="md" animate={true} />
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                    AI UYUMLULUK
                  </div>
                  <div className="mt-1 text-[20px] font-semibold tracking-[-0.025em]">
                    {verdict}
                  </div>
                  <p className="mt-1 text-[12.5px] text-text-2 leading-snug">
                    Yetkinliklerin bu ilanın gereksinimleriyle{" "}
                    {matchPct >= 60 ? "iyi" : "kısmen"} örtüşüyor.
                  </p>
                </div>
              </div>

              {required.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                    <span>İlan istiyor</span>
                    <span>Senin seviyen</span>
                  </div>
                  <div className="divide-y divide-border border-t border-border">
                    {required.slice(0, 8).map((s) => {
                      const mine = mySkillsMap.get(s.toLowerCase());
                      return (
                        <div
                          key={s}
                          className="flex items-center justify-between py-2.5 text-[13px]"
                        >
                          <span className="inline-flex items-center gap-2">
                            {mine ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <span className="h-3 w-px bg-text-muted/40" />
                            )}
                            {s}
                          </span>
                          <span
                            className={`font-mono text-[11.5px] ${
                              mine
                                ? mine.confidence === "HIGH"
                                  ? "text-emerald-400"
                                  : mine.confidence === "MEDIUM"
                                    ? "text-amber-400"
                                    : "text-text-muted"
                                : "text-text-muted"
                            }`}
                          >
                            {mine
                              ? mine.confidence === "HIGH"
                                ? "ileri"
                                : mine.confidence === "MEDIUM"
                                  ? "orta"
                                  : "düşük"
                              : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {quotaMessage ? (
                <QuotaBanner message={quotaMessage} />
              ) : applied ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  ✓ Başvurun alındı!
                  <button
                    onClick={() => router.push("/dashboard/applications")}
                    className="mt-2 block text-xs underline"
                  >
                    Başvurularımı gör →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {showCover && (
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Ön yazı (opsiyonel)..."
                      rows={4}
                      className="block w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-text"
                    />
                  )}
                  {error && (
                    <div className="rounded-md bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-300">
                      {error}
                    </div>
                  )}
                  <Button
                    onClick={handleApply}
                    loading={applying}
                    variant="ai"
                    size="lg"
                    className="w-full"
                  >
                    <Sparkles size={15} /> Hemen başvur
                  </Button>
                  {!showCover && (
                    <button
                      type="button"
                      onClick={() => setShowCover(true)}
                      className="block w-full text-center font-mono text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
                    >
                      + Ön yazı ekle
                    </button>
                  )}
                  {billing?.isPremium ? (
                    <button
                      type="button"
                      className="btn btn--outline w-full"
                      disabled
                    >
                      <Sparkles size={13} /> AI ile öne çıkar (yakında)
                    </button>
                  ) : (
                    <Link
                      href="/dashboard/billing"
                      className="btn btn--outline w-full"
                      title="Premium özellik"
                    >
                      <Lock size={12} /> AI ile öne çıkar
                    </Link>
                  )}
                </div>
              )}

              <div className="border-t border-border pt-3 text-center font-mono text-[11px] text-text-muted">
                {job.applicationCount} başvuru
                {job.applicationCount > 5 && (
                  <>
                    <span className="mx-2">·</span>
                    <span>{Math.floor(job.applicationCount / 3)} yüksek skor</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
