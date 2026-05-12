"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Check,
  Building2,
  Calendar,
  Eye,
} from "lucide-react";

import { userJobsApi } from "@/lib/jobs-user-api";
import { analysisApi } from "@/lib/analysis-api";
import { QuotaBanner } from "@/components/QuotaBanner";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";
import type { JobResponse } from "@/types/jobs";
import type { AnalysisReport } from "@/types/analysis";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
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
  }, [id]);

  // Compute skill match
  const mySkills = new Set(
    (analysis?.skillScores ?? []).map((s) => s.skill.toLowerCase())
  );
  const requiredSkills = job?.requiredSkills ?? [];
  const matched = requiredSkills.filter((s) => mySkills.has(s.toLowerCase()));
  const matchPct = requiredSkills.length
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : analysis?.overallScore ?? 0;

  // Animate match
  const [animatedMatch, setAnimatedMatch] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setAnimatedMatch(matchPct), 300);
    return () => clearTimeout(id);
  }, [matchPct]);

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

  if (loading)
    return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!job)
    return <div className="text-red-400">{error}</div>;

  const initials = job.companyName.charAt(0).toUpperCase();
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];
  const color = colors[job.companyName.charCodeAt(0) % colors.length];

  return (
    <>
      <Link
        href="/dashboard/jobs"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-text-2 hover:text-text"
      >
        <ArrowLeft size={14} /> İlanlar
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left — content */}
        <div className="space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <div className="flex items-start gap-4">
              <span
                className="grid h-16 w-16 place-items-center rounded-2xl text-[22px] font-semibold text-white"
                style={{ background: color }}
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="page-head__crumbs mb-1">
                  <Building2 size={12} /> {job.companyName}
                </div>
                <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
                  {job.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.city && (
                    <span className="pill">
                      <MapPin size={11} /> {job.city}
                    </span>
                  )}
                  <span className="pill">
                    {job.remoteType === "REMOTE"
                      ? "Uzaktan"
                      : job.remoteType === "HYBRID"
                        ? "Hibrit"
                        : "Ofisten"}
                  </span>
                  <span className="pill">{job.level}</span>
                  {(job.salaryMin || job.salaryMax) && (
                    <span className="pill pill--success">
                      {[job.salaryMin, job.salaryMax].filter(Boolean).join("–")}{" "}
                      {job.currency}
                    </span>
                  )}
                  <span className="pill pill--muted">
                    <Eye size={11} /> {job.viewCount}
                  </span>
                  <span className="pill pill--muted">
                    <Calendar size={11} />{" "}
                    {new Date(job.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-medium">
              <Sparkles size={14} className="text-text-muted" /> İlan açıklaması
            </h2>
            <div className="whitespace-pre-wrap text-[14.5px] leading-[1.65] text-text">
              {job.description}
            </div>

            {job.requiredSkills.length > 0 && (
              <div className="mt-6 pt-5 border-t border-border">
                <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                  Aranan yetkinlikler
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className={
                        mySkills.has(s.toLowerCase())
                          ? "pill pill--success"
                          : "pill"
                      }
                    >
                      {mySkills.has(s.toLowerCase()) && <Check size={11} />} {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — sticky apply card */}
        <aside>
          <div className="apply-card">
            <div className="apply-card__inner">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                  Bu ilana uygunluğun
                </span>
              </div>

              <div className="mb-5 flex items-center gap-4">
                <div
                  className="match-ring"
                  style={
                    {
                      width: 120,
                      height: 120,
                      "--m": animatedMatch,
                    } as React.CSSProperties
                  }
                >
                  <div className="match-ring__bg" />
                  <div className="match-ring__num text-center" style={{ fontSize: 28 }}>
                    %{matchPct}
                  </div>
                </div>
                <div className="text-[13px] text-text-2 leading-snug">
                  CV yetkinliklerin ile ilanın aradığı{" "}
                  <b className="text-text">{requiredSkills.length}</b> skill karşılaştırıldı.
                  <br />
                  <span className="font-mono text-[12px] text-emerald-400">
                    ✓ {matched.length} eşleşti
                  </span>
                </div>
              </div>

              {quotaMessage ? (
                <div className="mb-4">
                  <QuotaBanner message={quotaMessage} />
                </div>
              ) : applied ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  ✅ Başvurun alındı!
                  <button
                    onClick={() => router.push("/dashboard/applications")}
                    className="mt-2 block text-xs underline"
                  >
                    Başvurularımı gör →
                  </button>
                </div>
              ) : (
                <>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Ön yazı (opsiyonel)..."
                    rows={5}
                    className="mb-3 block w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-text"
                  />
                  {error && (
                    <div className="mb-3 rounded-md bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-300">
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
                    <Sparkles size={15} /> Bu ilana başvur
                  </Button>
                  <p className="mt-2 text-center font-mono text-[10.5px] uppercase tracking-wider text-text-muted">
                    ATS skoru otomatik hesaplanır
                  </p>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
