"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { Bookmark, MapPin, Briefcase, Sparkles } from "lucide-react";

import { userJobsApi } from "@/lib/jobs-user-api";
import { BookmarkButton } from "@/components/jobs/BookmarkButton";
import type { ApiError } from "@/types/auth";
import type { JobResponse } from "@/types/jobs";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userJobsApi
      .saved()
      .then(setJobs)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Yükleme başarısız");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Bookmark size={12} /> KAYITLI İLANLAR
          </div>
          <h1 className="page-head__title">
            {jobs.length > 0 ? (
              <>
                <span className="ai-text">{jobs.length}</span> kayıtlı ilan
              </>
            ) : (
              <>
                Henüz <span className="ai-text">kaydın</span> yok
              </>
            )}
          </h1>
          <p className="page-head__sub mt-1.5">
            İlanları imleyip listene ekle, sonra hızlıca dön ve başvur.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Yükleniyor...</p>
      ) : error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong p-16 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-surface-2">
            <Bookmark size={24} className="text-text-muted" />
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.025em]">
            Henüz ilan kaydetmedin
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] text-text-2">
            İlan listesinde 🔖 simgesine tıklayarak ilanları sonra dönmek için kaydet.
          </p>
          <Link href="/dashboard/jobs" className="btn btn--ai btn--lg mt-6 inline-flex">
            <Sparkles size={14} /> İlanlara göz at
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {jobs.map((j) => (
            <SavedCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </>
  );
}

function SavedCard({ job }: { job: JobResponse }) {
  const initials = job.companyName.charAt(0).toUpperCase();
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];
  const color = colors[job.companyName.charCodeAt(0) % colors.length];

  return (
    <div className="job-card">
      <div className="job-card__head">
        <span className="job-card__logo" style={{ background: color }}>
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/jobs/${job.id}`}
            className="job-card__title block truncate hover:text-ai-2"
          >
            {job.title}
          </Link>
          <div className="job-card__co truncate">{job.companyName}</div>
        </div>
        <BookmarkButton jobId={job.id} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {job.city && (
          <span className="pill" style={{ fontSize: 11.5 }}>
            <MapPin size={11} /> {job.city}
          </span>
        )}
        <span className="pill" style={{ fontSize: 11.5 }}>
          {job.remoteType === "REMOTE" ? "Uzaktan" : job.remoteType === "HYBRID" ? "Hibrit" : "Ofisten"}
        </span>
        <span className="pill" style={{ fontSize: 11.5 }}>
          {job.level}
        </span>
      </div>
      <Link
        href={`/dashboard/jobs/${job.id}`}
        className="btn btn--outline btn--sm mt-auto"
      >
        <Briefcase size={12} /> İlanı aç
      </Link>
    </div>
  );
}
