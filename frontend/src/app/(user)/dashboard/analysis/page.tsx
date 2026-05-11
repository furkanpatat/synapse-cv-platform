"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import { analysisApi } from "@/lib/analysis-api";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";
import type { AnalysisReport, SkillScore, Inconsistency } from "@/types/analysis";

export default function AnalysisPage() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analysisApi
      .me()
      .then(setReport)
      .catch((err: AxiosError<ApiError>) => {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message ?? "Hata");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    setError(null);
    setRunning(true);
    try {
      const r = await analysisApi.start();
      setReport(r);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Analiz başarısız");
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Yetkinlik Analizi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            CV yeteneklerini GitHub aktivitenle karşılaştırır, doğrulanma puanları üretir.
          </p>
        </div>
        <Button onClick={handleStart} loading={running}>
          {report ? "Yeniden Analiz Et" : "Analizi Başlat"}
        </Button>
      </header>

      {running && (
        <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200">
          ⏳ GitHub verisi çekiliyor ve Gemini analizi yapılıyor... (30-60sn)
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {!report && !running && !error && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Henüz analiz yapılmadı. Önce CV yükle ve profilinde GitHub URL'ini ekle, sonra
            yukarıdaki butona bas.
          </p>
        </div>
      )}

      {report && <ReportView report={report} />}
    </div>
  );
}

function ReportView({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-6">
      <OverallCard report={report} />

      <Section title="🐙 GitHub Özeti">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Public Repo" value={report.github.publicRepos ?? 0} />
          <Stat label="Toplam Yıldız" value={report.github.totalStars ?? 0} />
          <Stat
            label="Diller"
            value={Object.keys(report.github.languageBytes ?? {}).length}
          />
          <Stat
            label="Son Aktivite"
            value={
              report.github.lastActivityAt
                ? new Date(report.github.lastActivityAt).toLocaleDateString("tr-TR")
                : "—"
            }
          />
        </div>
      </Section>

      {report.skillScores.length > 0 && (
        <Section title="🛠 Yetenek Skorları">
          <div className="space-y-3">
            {report.skillScores.map((s) => (
              <SkillBar key={s.skill} s={s} />
            ))}
          </div>
        </Section>
      )}

      {report.inconsistencies.length > 0 && (
        <Section title="⚠️ Tutarsızlıklar">
          <div className="space-y-2">
            {report.inconsistencies.map((i, idx) => (
              <InconsistencyRow key={idx} i={i} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function OverallCard({ report }: { report: AnalysisReport }) {
  const score = report.overallScore ?? 0;
  const color =
    score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-gray-500">Genel Skor</p>
          <p className={`text-5xl font-bold ${color}`}>{score}/100</p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{report.summary}</p>
        </div>
        <a
          href={`https://github.com/${report.githubUsername}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-brand hover:underline"
        >
          @{report.githubUsername} ↗
        </a>
      </div>
    </div>
  );
}

function SkillBar({ s }: { s: SkillScore }) {
  const color =
    s.score >= 75 ? "bg-green-500" : s.score >= 50 ? "bg-yellow-500" : "bg-red-500";
  const confBadge =
    s.confidence === "HIGH"
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
      : s.confidence === "MEDIUM"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{s.skill}</span>
          <span className={`rounded px-2 py-0.5 text-xs ${confBadge}`}>
            {s.confidence}
          </span>
        </div>
        <span className="text-sm font-mono">{s.score}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <div className={`h-full ${color}`} style={{ width: `${s.score}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{s.explanation}</p>
      {s.evidenceRepos.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {s.evidenceRepos.map((r) => (
            <span
              key={r}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800"
            >
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function InconsistencyRow({ i }: { i: Inconsistency }) {
  const color =
    i.severity === "HIGH"
      ? "border-red-400 bg-red-50 dark:bg-red-950"
      : i.severity === "MEDIUM"
        ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950"
        : "border-gray-300 bg-gray-50 dark:bg-gray-900";
  return (
    <div className={`rounded-md border-l-4 p-3 text-sm ${color}`}>
      <p className="font-medium">{i.claimedSkill}</p>
      <p className="text-gray-700 dark:text-gray-300">{i.issue}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
