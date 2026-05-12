"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { Inbox, ArrowRight, Briefcase, Sparkles } from "lucide-react";

import { userJobsApi } from "@/lib/jobs-user-api";
import type { ApiError } from "@/types/auth";
import type { ApplicationResponse, ApplicationStatus } from "@/types/jobs";

const TR_STATUS: Record<ApplicationStatus, string> = {
  NEW: "Yeni",
  REVIEWING: "İncelemede",
  INTERVIEW: "Mülakat",
  OFFERED: "Teklif",
  REJECTED: "Reddedildi",
};

function tone(s: ApplicationStatus): "review" | "accepted" | "pending" | "rejected" {
  if (s === "REVIEWING" || s === "INTERVIEW") return "review";
  if (s === "OFFERED") return "accepted";
  if (s === "REJECTED") return "rejected";
  return "pending";
}

export default function MyApplicationsPage() {
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userJobsApi
      .myApplications()
      .then(setApps)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Başvurular yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = apps.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      acc.total++;
      return acc;
    },
    { total: 0 } as Record<string, number>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Inbox size={12} /> BAŞVURULARIM
          </div>
          <h1 className="page-head__title">
            {apps.length > 0 ? (
              <>
                <span className="ai-text">{apps.length}</span> başvuru takipte
              </>
            ) : (
              <>
                Henüz <span className="ai-text">başvurun</span> yok
              </>
            )}
          </h1>
          <p className="page-head__sub mt-1.5">
            Gönderdiğin başvuruları ve şirketten gelen güncellemeleri takip et.
          </p>
        </div>
        <div className="page-head__actions">
          <Link href="/dashboard/jobs" className="btn btn--outline btn--lg">
            <Briefcase size={14} /> İlanlara göz at
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      {apps.length > 0 && (
        <div className="stats-grid">
          <StatusTile label="TOPLAM" value={apps.length} />
          <StatusTile
            label="İNCELEMEDE"
            value={(counts.REVIEWING ?? 0) + (counts.INTERVIEW ?? 0)}
            tone="warning"
          />
          <StatusTile label="TEKLİF" value={counts.OFFERED ?? 0} tone="success" />
          <StatusTile label="REDDEDİLDİ" value={counts.REJECTED ?? 0} tone="danger" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
          Yükleniyor...
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong p-16 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-surface-2">
            <Inbox size={24} className="text-text-muted" />
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.025em]">
            Henüz başvurun yok
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] text-text-2">
            İlanlara göz at, AI&apos;ın senin için seçtiği uyumlu rollere hızlı başvur.
          </p>
          <Link href="/dashboard/jobs" className="btn btn--ai btn--lg mt-6 inline-flex">
            <Sparkles size={14} /> İlanlara göz at
          </Link>
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
          <div className="timeline">
            {apps.map((a) => {
              const t = tone(a.status);
              return (
                <div key={a.id} className="tl">
                  <div className={`tl__dot tl__dot--${t}`} />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/jobs/${a.jobId}`}
                      className="tl__title hover:text-ai-2 transition"
                    >
                      {a.jobTitle}
                    </Link>
                    <div className="tl__meta">
                      {new Date(a.appliedAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      {(a.atsScore !== null || a.aiOverallScore !== null) && (
                        <>
                          <span className="mx-2 text-border">·</span>
                          {a.atsScore !== null && (
                            <span>
                              ATS{" "}
                              <span
                                className={
                                  a.atsScore >= 75
                                    ? "text-emerald-400"
                                    : a.atsScore >= 50
                                      ? "text-amber-400"
                                      : "text-red-400"
                                }
                              >
                                {a.atsScore}
                              </span>
                            </span>
                          )}
                          {a.atsScore !== null && a.aiOverallScore !== null && (
                            <span className="mx-2 text-border">·</span>
                          )}
                          {a.aiOverallScore !== null && (
                            <span>AI {a.aiOverallScore}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/jobs/${a.jobId}`}
                    className="flex items-center gap-2"
                  >
                    <span className={`tl__status tl__status--${t}`}>
                      {TR_STATUS[a.status]}
                    </span>
                    <ArrowRight size={14} className="text-text-muted" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function StatusTile({
  label,
  value,
  tone: t,
}: {
  label: string;
  value: number;
  tone?: "warning" | "success" | "danger";
}) {
  const color =
    t === "warning"
      ? "text-amber-400"
      : t === "success"
        ? "text-emerald-400"
        : t === "danger"
          ? "text-red-400"
          : "";
  return (
    <div className="stat-tile">
      <div className="stat-tile__head">
        <span className="stat-tile__label">{label}</span>
      </div>
      <div className={`stat-tile__num ${color}`}>{value}</div>
    </div>
  );
}
