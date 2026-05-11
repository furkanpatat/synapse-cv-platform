"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";

import { userJobsApi } from "@/lib/jobs-user-api";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import type { ApiError } from "@/types/auth";
import type { JobResponse } from "@/types/jobs";

export default function JobsListPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [recommended, setRecommended] = useState<JobResponse[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [level, setLevel] = useState("");
  const [remote, setRemote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      userJobsApi.list(0, 50).then((p) => p.content),
      userJobsApi.recommended(5).catch(() => []),
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

  const filtered = jobs.filter((j) => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (city && (j.city || "").toLowerCase() !== city.toLowerCase()) return false;
    if (level && j.level !== level) return false;
    if (remote && j.remoteType !== remote) return false;
    return true;
  });

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">İş İlanları</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Yeteneklerine uygun pozisyonları keşfet ve başvur.
        </p>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {recommended.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
            ⭐ Sana Önerilen
          </h2>
          <div className="space-y-2">
            {recommended.map((j) => (
              <JobCard key={j.id} j={j} highlight />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="Pozisyon ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <input
            placeholder="Şehir"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Tüm Seviyeler</option>
            <option value="JUNIOR">Junior</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
            <option value="LEAD">Lead</option>
          </select>
          <select
            value={remote}
            onChange={(e) => setRemote(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Tüm Çalışma Şekilleri</option>
            <option value="ONSITE">Ofisten</option>
            <option value="HYBRID">Hibrit</option>
            <option value="REMOTE">Uzaktan</option>
          </select>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Tüm İlanlar ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <p className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
            Filtreyle eşleşen ilan yok.
          </p>
        ) : (
          filtered.map((j) => <JobCard key={j.id} j={j} />)
        )}
      </section>
    </div>
  );
}

function JobCard({ j, highlight = false }: { j: JobResponse; highlight?: boolean }) {
  return (
    <Link
      href={`/dashboard/jobs/${j.id}`}
      className={`block rounded-lg border bg-white p-4 transition hover:border-brand hover:shadow-sm dark:bg-gray-900 ${
        highlight
          ? "border-brand/40 bg-brand/5 dark:border-brand/40"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{j.title}</h3>
            <JobStatusBadge status={j.status} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {j.companyName} ·{" "}
            {[j.city, j.remoteType, j.level].filter(Boolean).join(" · ")}
          </p>
          {j.requiredSkills.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {j.requiredSkills.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="rounded bg-brand/10 px-2 py-0.5 text-xs text-brand"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {(j.salaryMin || j.salaryMax) && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {[j.salaryMin, j.salaryMax].filter(Boolean).join(" - ")} {j.currency}
          </span>
        )}
      </div>
    </Link>
  );
}
