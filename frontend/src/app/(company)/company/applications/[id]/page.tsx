"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AxiosError } from "axios";

import { companyApi } from "@/lib/company-api";
import { ApplicationStatusBadge } from "@/components/jobs/ApplicationStatusBadge";
import type { ApiError } from "@/types/auth";
import type { ApplicationResponse, ApplicationStatus } from "@/types/jobs";

type ApplicationDetail = {
  application: ApplicationResponse;
  cv: {
    personal?: { name?: string; email?: string };
    summary?: string;
    skills?: string[];
    education?: { school: string; degree: string; field?: string }[];
    experience?: { role: string; company: string; description?: string }[];
  } | null;
  analysis: {
    overallScore?: number;
    summary?: string;
    skillScores?: { skill: string; score: number; confidence: string; explanation: string }[];
    inconsistencies?: { claimedSkill: string; issue: string; severity: string }[];
  } | null;
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "NEW",
  "REVIEWING",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
];

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    companyApi
      .getApplicationDetail(id)
      .then((d) => setData(d as ApplicationDetail))
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Yükleme başarısız");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (status: ApplicationStatus) => {
    if (!data) return;
    const updated = await companyApi.updateApplicationStatus(data.application.id, status);
    setData({ ...data, application: updated });
  };

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  if (!data) return <div className="text-red-700">{error}</div>;

  const a = data.application;
  const cv = data.cv;
  const analysis = data.analysis;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <header className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {a.userFirstName} {a.userLastName}
              </h1>
              <p className="text-sm text-gray-500">
                {[a.userTitle, a.userCity, a.userEmail].filter(Boolean).join(" · ")}
              </p>
              {a.userGithubUrl && (
                <a
                  href={a.userGithubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-brand hover:underline"
                >
                  GitHub ↗
                </a>
              )}
            </div>
            <ApplicationStatusBadge status={a.status} />
          </div>
          <p className="mt-3 text-sm">
            <span className="text-gray-500">İlan:</span> {a.jobTitle}
          </p>
        </header>

        {cv && (
          <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-semibold">📄 CV Özeti</h2>
            {cv.summary && <p className="text-sm">{cv.summary}</p>}
            {cv.skills && cv.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cv.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {cv.experience && cv.experience.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase text-gray-500">Deneyim</p>
                {cv.experience.slice(0, 3).map((e, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium">
                      {e.role} · {e.company}
                    </p>
                    {e.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {e.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {analysis && (
          <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">🤖 AI Yetkinlik Analizi</h2>
              {analysis.overallScore !== undefined && (
                <span className="text-2xl font-bold">{analysis.overallScore}/100</span>
              )}
            </div>
            {analysis.summary && <p className="text-sm">{analysis.summary}</p>}
            {analysis.skillScores && (
              <div className="space-y-2">
                {analysis.skillScores.slice(0, 10).map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm">
                      <span>{s.skill}</span>
                      <span className="font-mono">{s.score}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className={
                          s.score >= 75
                            ? "h-full bg-green-500"
                            : s.score >= 50
                              ? "h-full bg-yellow-500"
                              : "h-full bg-red-500"
                        }
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {analysis.inconsistencies && analysis.inconsistencies.length > 0 && (
              <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-3 dark:bg-red-950">
                <p className="text-xs font-semibold uppercase text-red-700 dark:text-red-300">
                  Tutarsızlıklar
                </p>
                <ul className="mt-1 list-disc pl-4 text-xs text-red-800 dark:text-red-200">
                  {analysis.inconsistencies.map((i, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{i.claimedSkill}:</span> {i.issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {!cv && !analysis && (
          <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
            Aday henüz CV yüklemediyse veya AI analiz yapmadıysa veri görüntülenemez.
          </div>
        )}
      </div>

      {/* Sidebar: status update */}
      <aside className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold">Durum Güncelle</h3>
          <div className="space-y-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatus(s)}
                disabled={a.status === s}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                  a.status === s
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                <ApplicationStatusBadge status={s} />
              </button>
            ))}
          </div>
        </div>

        {a.coverLetter && (
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold">Ön Yazı</h3>
            <p className="whitespace-pre-wrap text-sm">{a.coverLetter}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
