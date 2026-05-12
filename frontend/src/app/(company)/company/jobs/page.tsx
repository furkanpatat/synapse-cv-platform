"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import {
  Briefcase,
  Plus,
  Search,
  ChevronRight,
  Eye,
  Users,
} from "lucide-react";

import { companyApi } from "@/lib/company-api";
import type { ApiError } from "@/types/auth";
import type { JobResponse, JobStatus } from "@/types/jobs";

const STATUS_LABEL: Record<JobStatus, string> = {
  ACTIVE: "YAYINDA",
  DRAFT: "TASLAK",
  CLOSED: "KAPALI",
};

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | JobStatus>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    companyApi
      .listJobs()
      .then(setJobs)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "İlanlar yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (statusFilter && j.status !== statusFilter) return false;
      if (s && !`${j.title} ${(j.requiredSkills || []).join(" ")}`.toLowerCase().includes(s)) {
        return false;
      }
      return true;
    });
  }, [jobs, search, statusFilter]);

  const active = jobs.filter((j) => j.status === "ACTIVE").length;
  const draft = jobs.filter((j) => j.status === "DRAFT").length;
  const closed = jobs.filter((j) => j.status === "CLOSED").length;
  const totalApps = jobs.reduce((s, j) => s + j.applicationCount, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Briefcase size={12} /> İLANLARIM
          </div>
          <h1 className="page-head__title">
            <span className="ai-text">{jobs.length}</span> ilan yönetimi
          </h1>
          <p className="page-head__sub mt-1.5">
            Yayındaki ilanlarını, taslaklarını ve gelen başvuruları tek yerden yönet.
          </p>
        </div>
        <div className="page-head__actions">
          <Link href="/company/jobs/new" className="btn btn--ai btn--lg">
            <Plus size={15} /> Yeni ilan
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatusTile label="TOPLAM" value={jobs.length} />
        <StatusTile label="YAYINDA" value={active} tone="success" />
        <StatusTile label="TASLAK" value={draft} tone="warning" />
        <StatusTile label="BAŞVURU" value={totalApps} />
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-bar__input">
          <Search size={14} className="text-text-muted shrink-0" />
          <input
            placeholder="İlan veya skill ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | JobStatus)}
        >
          <option value="">Tüm durumlar</option>
          <option value="ACTIVE">Yayında</option>
          <option value="DRAFT">Taslak</option>
          <option value="CLOSED">Kapalı</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
          Yükleniyor...
        </div>
      ) : filtered.length === 0 ? (
        jobs.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong p-16 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl ai-grad shadow-[0_24px_48px_-16px_hsla(218,92%,55%,0.4)]">
              <Briefcase size={24} className="text-white" />
            </div>
            <h2 className="text-[20px] font-semibold tracking-[-0.025em]">
              İlk <span className="ai-text">ilanını</span> oluştur
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] text-text-2">
              Yeteneklerini AI ile doğrulamış adaylar başvurularını bekliyor.
            </p>
            <Link href="/company/jobs/new" className="btn btn--ai btn--lg mt-6 inline-flex">
              <Plus size={15} /> Yeni ilan oluştur
            </Link>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-12 text-center text-sm text-text-muted">
            Filtreyle eşleşen ilan yok.
          </div>
        )
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-2">
          {filtered.map((j) => (
            <JobRow key={j.id} job={j} />
          ))}
        </div>
      )}
    </>
  );
}

function JobRow({ job }: { job: JobResponse }) {
  return (
    <Link
      href={`/company/jobs/${job.id}`}
      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-md px-4 py-4 transition hover:bg-surface-2"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[15px] font-medium tracking-[-0.01em]">
            {job.title}
          </h3>
          <span
            className={`job-row__pill ${
              job.status === "ACTIVE" ? "job-row__pill--live" : ""
            }`}
          >
            {STATUS_LABEL[job.status]}
          </span>
        </div>
        <div className="mt-1 font-mono text-[11.5px] text-text-muted tracking-wide">
          {[job.city, job.remoteType, job.level].filter(Boolean).join(" · ")}
          {(job.salaryMin || job.salaryMax) && (
            <>
              <span className="mx-2 text-border">·</span>
              {[job.salaryMin, job.salaryMax].filter(Boolean).join("–")}{" "}
              {job.currency}
            </>
          )}
        </div>
        {job.requiredSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.requiredSkills.slice(0, 4).map((s) => (
              <span
                key={s}
                className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-text-2"
              >
                {s}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span className="font-mono text-[10.5px] text-text-muted">
                +{job.requiredSkills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="font-mono text-[12.5px] text-text inline-flex items-center gap-1.5">
          <Users size={12} className="text-text-muted" /> {job.applicationCount}
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-text-muted">başvuru</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[12.5px] text-text inline-flex items-center gap-1.5">
          <Eye size={12} className="text-text-muted" /> {job.viewCount}
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-text-muted">görüntüleme</div>
      </div>
      <ChevronRight size={16} className="text-text-muted" />
    </Link>
  );
}

function StatusTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  const color =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
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
