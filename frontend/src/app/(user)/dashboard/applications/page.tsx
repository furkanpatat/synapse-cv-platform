"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";

import { userJobsApi } from "@/lib/jobs-user-api";
import { ApplicationStatusBadge } from "@/components/jobs/ApplicationStatusBadge";
import type { ApiError } from "@/types/auth";
import type { ApplicationResponse } from "@/types/jobs";

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

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Başvurularım</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gönderdiğin başvurular ve şirketten gelen güncellemeler.
        </p>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {apps.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Henüz başvurun yok.{" "}
            <Link href="/dashboard/jobs" className="text-brand hover:underline">
              İlanlara göz at →
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((a) => (
            <ApplicationRow key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationRow({ a }: { a: ApplicationResponse }) {
  return (
    <Link
      href={`/dashboard/jobs/${a.jobId}`}
      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{a.jobTitle}</h3>
          <ApplicationStatusBadge status={a.status} />
        </div>
        <p className="text-xs text-gray-500">
          {new Date(a.appliedAt).toLocaleDateString("tr-TR")} tarihinde başvuruldu
        </p>
      </div>
      <div className="text-right text-sm">
        {a.atsScore !== null && (
          <p className="font-mono">
            ATS:{" "}
            <span
              className={
                a.atsScore >= 75
                  ? "text-green-600"
                  : a.atsScore >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
              }
            >
              {a.atsScore}/100
            </span>
          </p>
        )}
        {a.aiOverallScore !== null && (
          <p className="font-mono text-xs">AI: {a.aiOverallScore}/100</p>
        )}
      </div>
    </Link>
  );
}
