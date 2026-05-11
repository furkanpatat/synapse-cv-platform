"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";

import { userJobsApi } from "@/lib/jobs-user-api";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";
import type { JobResponse } from "@/types/jobs";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userJobsApi
      .get(id)
      .then(setJob)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "İlan yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setError(null);
    setApplying(true);
    try {
      await userJobsApi.apply(id, coverLetter || undefined);
      setApplied(true);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      if (e.response?.data?.code === "ALREADY_APPLIED") {
        setApplied(true);
        setError(null);
      } else {
        setError(e.response?.data?.message ?? "Başvuru başarısız");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  if (!job) return <div className="text-red-700">{error}</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <header className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {job.companyName}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {[job.city, job.remoteType, job.level].filter(Boolean).join(" · ")}
            {(job.salaryMin || job.salaryMax) && (
              <>
                {" · "}
                {[job.salaryMin, job.salaryMax].filter(Boolean).join(" - ")}{" "}
                {job.currency}
              </>
            )}
          </p>
          {job.requiredSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-brand/10 px-2 py-0.5 text-xs text-brand"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 font-semibold">📋 İlan Açıklaması</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
            {job.description}
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold">Başvur</h3>

          {applied ? (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Başvurun alındı!
              <button
                onClick={() => router.push("/dashboard/applications")}
                className="mt-2 block text-xs text-brand hover:underline"
              >
                Başvurularımı gör →
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Ön yazı (isteğe bağlı)..."
                rows={6}
                className="mb-3 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              {error && (
                <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
                  {error}
                </div>
              )}
              <Button onClick={handleApply} loading={applying} className="w-full">
                Bu İlana Başvur
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                CV'ndeki yeteneklere göre otomatik ATS skoru hesaplanır.
              </p>
            </>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          <p>📊 {job.applicationCount} başvuru · {job.viewCount} görüntüleme</p>
        </div>
      </aside>
    </div>
  );
}
