"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";

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

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  if (!job) {
    return (
      <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {error ?? "İlan bulunamadı"}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-sm text-gray-500">
            {apps.length} başvuru · {job.viewCount} görüntüleme
          </p>
        </div>
        <Button variant="danger" onClick={handleDelete}>
          Sil
        </Button>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">İlan Bilgileri</h2>
        <JobForm
          initial={job}
          submitLabel="Güncelle"
          onSubmit={async (data) => {
            const updated = await companyApi.updateJob(id, data);
            setJob(updated);
          }}
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">Başvuranlar ({apps.length})</h2>
        {apps.length === 0 ? (
          <p className="text-sm text-gray-500">
            Henüz başvuru yok. İlan yayında değilse aktifleştir.
          </p>
        ) : (
          <div className="space-y-2">
            {apps.map((a) => (
              <ApplicantRow key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ApplicantRow({ a }: { a: ApplicationResponse }) {
  const score = a.aiOverallScore;
  return (
    <Link
      href={`/company/applications/${a.id}`}
      className="flex items-center justify-between rounded-md border border-gray-200 p-3 transition hover:border-brand hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {a.userFirstName} {a.userLastName}
          </span>
          <ApplicationStatusBadge status={a.status} />
        </div>
        <p className="text-xs text-gray-500">
          {[a.userTitle, a.userCity, a.userEmail].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="text-right text-sm">
        {score !== null ? (
          <p
            className={
              score >= 75
                ? "font-mono text-green-600"
                : score >= 50
                  ? "font-mono text-yellow-600"
                  : "font-mono text-red-600"
            }
          >
            AI: {score}/100
          </p>
        ) : (
          <p className="text-xs text-gray-400">AI skor yok</p>
        )}
        <p className="text-xs text-gray-500">
          {new Date(a.appliedAt).toLocaleDateString("tr-TR")}
        </p>
      </div>
    </Link>
  );
}
