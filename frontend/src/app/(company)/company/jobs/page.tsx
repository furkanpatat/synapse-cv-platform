"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";

import { companyApi } from "@/lib/company-api";
import { Button } from "@/components/ui/Button";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import type { ApiError } from "@/types/auth";
import type { JobResponse } from "@/types/jobs";

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
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

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İlanlarım</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Açık ilanlarını ve gelen başvuruları yönet.
          </p>
        </div>
        <Link href="/company/jobs/new">
          <Button>+ Yeni İlan</Button>
        </Link>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Henüz ilan yok. Üstteki butondan ilk ilanını oluştur.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <JobRow key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobRow({ job }: { job: JobResponse }) {
  return (
    <Link
      href={`/company/jobs/${job.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{job.title}</h3>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {[job.city, job.remoteType, job.level].filter(Boolean).join(" · ")}
          </p>
          {job.requiredSkills.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {job.requiredSkills.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="rounded bg-brand/10 px-2 py-0.5 text-xs text-brand"
                >
                  {s}
                </span>
              ))}
              {job.requiredSkills.length > 6 && (
                <span className="text-xs text-gray-500">
                  +{job.requiredSkills.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">
            {job.applicationCount} başvuru
          </p>
          <p className="text-xs text-gray-500">{job.viewCount} görüntüleme</p>
        </div>
      </div>
    </Link>
  );
}
