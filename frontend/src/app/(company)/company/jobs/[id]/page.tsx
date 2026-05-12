"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Trash2,
  Users,
  Eye,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import { companyApi } from "@/lib/company-api";
import { Button } from "@/components/ui/Button";
import { JobForm } from "@/components/jobs/JobForm";
import { ApplicationStatusBadge } from "@/components/jobs/ApplicationStatusBadge";
import type { ApiError } from "@/types/auth";
import type { ApplicationResponse, JobResponse } from "@/types/jobs";

export default function JobEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [job, setJob] = useState<JobResponse | null>(null);
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([companyApi.getJob(id), companyApi.listApplications(id)])
      .then(([j, a]) => {
        setJob(j);
        setApps(a);
      })
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "İlan yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Bu ilanı silmek istediğine emin misin?")) return;
    await companyApi.deleteJob(id);
    router.replace("/company/jobs");
  };

  if (loading) return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!job) {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
        {error ?? "İlan bulunamadı"}
      </div>
    );
  }

  // Sort applicants by AI score (highest first)
  const sortedApps = [...apps].sort(
    (a, b) => (b.aiOverallScore ?? -1) - (a.aiOverallScore ?? -1)
  );
  const highScoreCount = apps.filter(
    (a) => (a.aiOverallScore ?? 0) >= 70
  ).length;

  return (
    <>
      <Link
        href="/company/jobs"
        className="mb-5 inline-flex items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-text-2 hover:text-text"
      >
        <ArrowLeft size={13} /> İLANLARIMA DÖN
      </Link>

      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            {job.status === "ACTIVE" ? (
              <span className="job-row__pill job-row__pill--live">YAYINDA</span>
            ) : (
              <span className="job-row__pill">
                {job.status === "DRAFT" ? "TASLAK" : "KAPALI"}
              </span>
            )}
          </div>
          <h1 className="page-head__title">{job.title}</h1>
          <div className="page-head__sub mt-1.5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} /> {apps.length} başvuru
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={13} /> {job.viewCount} görüntüleme
            </span>
            {highScoreCount > 0 && (
              <>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1.5 text-ai-3">
                  <Sparkles size={13} /> {highScoreCount} yüksek AI skor
                </span>
              </>
            )}
          </div>
        </div>
        <div className="page-head__actions">
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={14} /> Sil
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT — applicants (the important panel) */}
        <div className="space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-medium">
                <Sparkles size={14} className="text-ai-2" /> AI sıralı başvuranlar
              </h3>
              <span className="font-mono text-[11.5px] text-text-2">
                {apps.length} aday
              </span>
            </div>

            {apps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-strong p-10 text-center text-sm text-text-muted">
                Henüz başvuru yok.
                {job.status !== "ACTIVE" && (
                  <p className="mt-2 text-xs">
                    İlanı yayınlamak için sağdaki form&apos;dan durumu{" "}
                    <b className="text-text">ACTIVE</b> yap.
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedApps.map((a) => (
                  <ApplicantRow key={a.id} a={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — edit form */}
        <aside>
          <div className="lg:sticky lg:top-6 rounded-[var(--radius-lg)] border border-border bg-surface p-7">
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium">
              ⚙️ İlanı düzenle
            </h3>
            <JobForm
              initial={job}
              submitLabel="Güncelle"
              onSubmit={async (data) => {
                const updated = await companyApi.updateJob(id, data);
                setJob(updated);
              }}
            />
          </div>
        </aside>
      </div>
    </>
  );
}

function ApplicantRow({ a }: { a: ApplicationResponse }) {
  const score = a.aiOverallScore;
  const initials =
    `${a.userFirstName?.[0] ?? ""}${a.userLastName?.[0] ?? ""}`.toUpperCase() || "U";
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const color = colors[(a.userFirstName ?? "U").charCodeAt(0) % colors.length];

  return (
    <Link
      href={`/company/applications/${a.id}`}
      className="grid grid-cols-[40px_1fr_auto_auto_16px] items-center gap-4 px-2 py-4 -mx-2 rounded-md transition hover:bg-surface-2"
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold text-white"
        style={{ background: color }}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium tracking-[-0.01em] truncate">
            {a.userFirstName} {a.userLastName}
          </span>
          <ApplicationStatusBadge status={a.status} />
        </div>
        <div className="mt-0.5 font-mono text-[11.5px] text-text-muted truncate">
          {[a.userTitle, a.userCity, a.userEmail].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div className="text-right">
        {score !== null && score !== undefined ? (
          <span
            className={`cand-score ${score < 60 ? "cand-score--mid" : ""}`}
            style={{ fontSize: 13 }}
          >
            {score}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-text-muted">—</span>
        )}
        <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-text-muted">
          AI SKOR
        </div>
      </div>
      <div className="text-right">
        {a.atsScore !== null ? (
          <span
            className={`font-mono text-[12.5px] ${
              a.atsScore >= 75
                ? "text-emerald-400"
                : a.atsScore >= 50
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {a.atsScore}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-text-muted">—</span>
        )}
        <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-text-muted">
          ATS
        </div>
      </div>
      <ChevronRight size={14} className="text-text-muted" />
    </Link>
  );
}
