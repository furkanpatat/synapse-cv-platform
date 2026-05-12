"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { Sparkles, Search, Briefcase, MapPin } from "lucide-react";

import { userJobsApi } from "@/lib/jobs-user-api";
import type { ApiError } from "@/types/auth";
import type { JobLevel, JobResponse, RemoteType } from "@/types/jobs";

export default function JobsListPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [recommended, setRecommended] = useState<JobResponse[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState<"" | JobLevel>("");
  const [remote, setRemote] = useState<"" | RemoteType>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      userJobsApi.list(0, 50).then((p) => p.content),
      userJobsApi.recommended(6).catch(() => []),
    ])
      .then(([all, rec]) => {
        setJobs(all);
        setRecommended(rec);
      })
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "İlanlar yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const c = city.trim().toLowerCase();
    return jobs.filter((j) => {
      if (s) {
        const hay = `${j.title} ${j.companyName} ${(j.requiredSkills || []).join(" ")}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (c && !(j.city || "").toLowerCase().includes(c)) return false;
      if (level && j.level !== level) return false;
      if (remote && j.remoteType !== remote) return false;
      return true;
    });
  }, [jobs, search, city, level, remote]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Briefcase size={12} /> İŞ İLANLARI
          </div>
          <h1 className="page-head__title">
            Sana <span className="ai-text">uygun</span> roller
          </h1>
          <p className="page-head__sub mt-1.5">
            CV yetkinliklerinle ilan gereksinimleri eşleştirilir, en uyumlu pozisyonlar öne çıkar.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-bar__input">
          <Search size={14} className="text-text-muted shrink-0" />
          <input
            placeholder="Pozisyon ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          placeholder="Şehir"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="filter-bar__input"
          style={{ flex: "0 1 200px" }}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value as "" | JobLevel)}>
          <option value="">Tüm seviyeler</option>
          <option value="JUNIOR">Junior</option>
          <option value="MID">Mid</option>
          <option value="SENIOR">Senior</option>
          <option value="LEAD">Lead</option>
        </select>
        <select
          value={remote}
          onChange={(e) => setRemote(e.target.value as "" | RemoteType)}
        >
          <option value="">Çalışma şekli</option>
          <option value="ONSITE">Ofisten</option>
          <option value="HYBRID">Hibrit</option>
          <option value="REMOTE">Uzaktan</option>
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
      ) : (
        <>
          {recommended.length > 0 && (
            <div className="ai-carousel">
              <div className="ai-carousel__head">
                <h3 className="flex items-center gap-2 text-[13px] font-medium">
                  <Sparkles size={14} className="text-ai-2" /> AI sana özel önerdi
                </h3>
                <span className="font-mono text-[11.5px] text-text-2">
                  CV uyumluluğuna göre sıralandı
                </span>
              </div>
              <div className="ai-carousel__row">
                {recommended.slice(0, 6).map((j, i) => (
                  <JobCard key={j.id} job={j} ai matchScore={Math.max(20, 100 - i * 8)} />
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-text-2">
              Tüm ilanlar ({filtered.length})
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-12 text-center text-sm text-text-muted">
              Filtreyle eşleşen ilan yok.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((j, i) => (
                <JobCard key={j.id} job={j} matchScore={Math.max(20, 90 - i * 4)} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function JobCard({
  job,
  ai,
  matchScore,
}: {
  job: JobResponse;
  ai?: boolean;
  matchScore: number;
}) {
  const initials = job.companyName.charAt(0).toUpperCase();
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];
  const color = colors[job.companyName.charCodeAt(0) % colors.length];

  const [m, setM] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setM(matchScore), 300);
    return () => clearTimeout(id);
  }, [matchScore]);

  return (
    <Link href={`/dashboard/jobs/${job.id}`} className={`job-card ${ai ? "job-card--ai" : ""}`}>
      <div className="job-card__head">
        <span className="job-card__logo" style={{ background: color }}>
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="job-card__title truncate">{job.title}</div>
          <div className="job-card__co truncate">{job.companyName}</div>
        </div>
        <div
          className="match-ring"
          style={{ width: 48, height: 48, "--m": m } as React.CSSProperties}
        >
          <div className="match-ring__bg" />
          <span className="match-ring__num" style={{ fontSize: 12 }}>
            %{matchScore}
          </span>
        </div>
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
        {(job.salaryMin || job.salaryMax) && (
          <span className="pill pill--success" style={{ fontSize: 11.5 }}>
            {[job.salaryMin, job.salaryMax].filter(Boolean).join("–")} {job.currency}
          </span>
        )}
      </div>

      {job.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.requiredSkills.slice(0, 5).map((s) => (
            <span
              key={s}
              className="font-mono text-[10.5px] uppercase tracking-wider px-2 py-0.5 rounded text-text-2 bg-surface-2"
            >
              {s}
            </span>
          ))}
          {job.requiredSkills.length > 5 && (
            <span className="font-mono text-[10.5px] text-text-muted">
              +{job.requiredSkills.length - 5}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
