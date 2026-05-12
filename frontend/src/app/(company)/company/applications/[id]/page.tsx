"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  MessageSquare,
  Github,
  Sparkles,
  AlertTriangle,
  Check,
  MapPin,
  Briefcase,
  Mail,
} from "lucide-react";

import { companyApi } from "@/lib/company-api";
import { messagingApi } from "@/lib/messaging-api";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";
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
    skillScores?: {
      skill: string;
      score: number;
      confidence: string;
      explanation: string;
      evidenceRepos?: string[];
    }[];
    inconsistencies?: { claimedSkill: string; issue: string; severity: string }[];
    githubUsername?: string;
  } | null;
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "NEW",
  "REVIEWING",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: "Yeni",
  REVIEWING: "İnceleniyor",
  INTERVIEW: "Mülakatta",
  OFFERED: "Teklif yapıldı",
  REJECTED: "Reddedildi",
};

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
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
    const updated = await companyApi.updateApplicationStatus(
      data.application.id,
      status
    );
    setData({ ...data, application: updated });
  };

  const handleMessage = async () => {
    if (!data) return;
    setMessaging(true);
    try {
      await messagingApi.send({
        toUserId: data.application.userId,
        body: `Merhaba ${data.application.userFirstName}, "${data.application.jobTitle}" başvurun için seninle iletişime geçmek istiyoruz.`,
      });
      router.push("/company/messages");
    } catch {
      setError("Mesaj başlatılamadı");
    } finally {
      setMessaging(false);
    }
  };

  if (loading) return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!data) return <div className="text-red-400">{error}</div>;

  const a = data.application;
  const cv = data.cv;
  const analysis = data.analysis;
  const initials =
    `${a.userFirstName?.[0] ?? ""}${a.userLastName?.[0] ?? ""}`.toUpperCase() || "U";
  const aiScore = analysis?.overallScore ?? a.aiOverallScore ?? 0;
  const verdict =
    aiScore >= 80 ? "GÜÇLÜ ADAY" :
    aiScore >= 60 ? "UMUT VERİCİ" :
    aiScore >= 40 ? "ORTA DÜZEY" : "ZAYIF EŞLEŞME";

  return (
    <>
      <Link
        href={`/company/jobs/${a.jobId}`}
        className="mb-5 inline-flex items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-text-2 hover:text-text"
      >
        <ArrowLeft size={13} /> İLANA DÖN · {a.jobTitle}
      </Link>

      {/* Candidate hero */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7 mb-5">
        <div className="flex flex-wrap items-start gap-5">
          <span
            className="grid h-16 w-16 place-items-center rounded-2xl text-[24px] font-semibold text-white shrink-0 ai-grad"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
                {a.userFirstName} {a.userLastName}
              </h1>
              <ApplicationStatusBadge status={a.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-text-2">
              {a.userTitle && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase size={12} /> {a.userTitle}
                </span>
              )}
              {a.userCity && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} /> {a.userCity}
                </span>
              )}
              <a
                href={`mailto:${a.userEmail}`}
                className="inline-flex items-center gap-1.5 hover:text-text"
              >
                <Mail size={12} /> {a.userEmail}
              </a>
              {a.userGithubUrl && (
                <a
                  href={a.userGithubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-text"
                >
                  <Github size={12} /> GitHub ↗
                </a>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {a.atsScore !== null && (
                <span className="pill">
                  ATS: <b className="ml-1 text-text">{a.atsScore}/100</b>
                </span>
              )}
              <span className="pill pill--ai" style={{ fontSize: 11 }}>
                <Sparkles size={11} /> AI {aiScore}/100 · {verdict}
              </span>
              <span className="pill pill--muted">
                {new Date(a.appliedAt).toLocaleDateString("tr-TR")} başvurdu
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT — candidate detail */}
        <div className="space-y-5">
          {/* AI verdict hero */}
          {analysis && (
            <div className="card--grad-border">
              <div className="card__inner">
                <div className="grid gap-5 sm:grid-cols-[120px_1fr] items-center">
                  <ScoreRing score={aiScore} size="md" animate={true} />
                  <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                      AI YETKİNLİK DEĞERLENDİRMESİ
                    </div>
                    <div className="mt-1 text-[22px] font-semibold tracking-[-0.025em]">
                      {verdict}
                    </div>
                    {analysis.summary && (
                      <p className="mt-2 text-[13.5px] leading-snug text-text-2">
                        {analysis.summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CV summary */}
          {cv && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium">
                📄 CV özeti
              </h3>
              {cv.summary && (
                <p className="mb-4 text-[14px] leading-[1.55] text-text-2">
                  {cv.summary}
                </p>
              )}
              {cv.skills && cv.skills.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                    Yetkinlikler ({cv.skills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cv.skills.slice(0, 20).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[12px] text-text-2"
                      >
                        {s}
                      </span>
                    ))}
                    {cv.skills.length > 20 && (
                      <span className="font-mono text-[11px] text-text-muted">
                        +{cv.skills.length - 20}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {cv.experience && cv.experience.length > 0 && (
                <div>
                  <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                    Deneyim
                  </div>
                  <div className="space-y-3">
                    {cv.experience.slice(0, 3).map((e, i) => (
                      <div key={i} className="border-l-2 border-ai-2/40 pl-3">
                        <div className="text-[13.5px] font-medium">
                          {e.role} · {e.company}
                        </div>
                        {e.description && (
                          <p className="mt-1 text-[12.5px] leading-snug text-text-2">
                            {e.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skill scores */}
          {analysis?.skillScores && analysis.skillScores.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
              <h3 className="mb-4 flex items-center gap-2 text-[13px] font-medium">
                <Sparkles size={14} className="text-ai-2" /> Yetkinlik dökümü
              </h3>
              <div className="space-y-1">
                {analysis.skillScores.slice(0, 12).map((s) => {
                  const tone =
                    s.confidence === "HIGH"
                      ? "high"
                      : s.confidence === "MEDIUM"
                        ? "med"
                        : "low";
                  return (
                    <div key={s.skill} className="skill-row">
                      <div className="skill-row__name truncate">{s.skill}</div>
                      <div className="skill-row__bar">
                        <div
                          className={`skill-row__fill skill-row__fill--${tone}`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                      <div className="skill-row__meta">
                        <span className={`skill-row__chip skill-row__chip--${tone}`}>
                          {s.confidence === "HIGH"
                            ? "Yüksek"
                            : s.confidence === "MEDIUM"
                              ? "Orta"
                              : "Düşük"}
                        </span>
                        <span className="skill-row__pct">{s.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inconsistencies */}
          {analysis?.inconsistencies && analysis.inconsistencies.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium">
                <AlertTriangle size={14} className="text-red-400" /> Tutarsızlıklar (
                {analysis.inconsistencies.length})
              </h3>
              <p className="mb-4 text-[12.5px] text-text-muted">
                CV&apos;de iddia edilen ama GitHub kanıtıyla desteklenmeyen
                yetkinlikler.
              </p>
              <div className="space-y-2.5">
                {analysis.inconsistencies.map((i, idx) => (
                  <div key={idx} className="incon">
                    <div className="incon__icon">
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-medium tracking-[-0.01em]">
                          {i.claimedSkill}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-red-400 bg-red-500/10 rounded px-1.5 py-0.5">
                          {i.severity}
                        </span>
                      </div>
                      <p className="text-[13px] text-text-2 leading-[1.55]">
                        {i.issue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!cv && !analysis && (
            <div className="rounded-md border border-dashed border-border-strong p-8 text-center text-sm text-text-muted">
              Aday henüz CV yüklemediyse veya AI analiz yapmadıysa veri görüntülenemez.
            </div>
          )}
        </div>

        {/* RIGHT — actions */}
        <aside className="space-y-5">
          <div className="lg:sticky lg:top-6 space-y-5">
            {/* Contact */}
            <div className="rounded-[var(--radius-lg)] border border-ai-2/30 bg-surface p-6">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium">
                <MessageSquare size={14} className="text-ai-2" /> Adayla iletişim
              </h3>
              <Button
                onClick={handleMessage}
                loading={messaging}
                variant="ai"
                className="w-full"
              >
                <MessageSquare size={14} /> Mesaj başlat
              </Button>
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-wider text-text-muted text-center">
                Otomatik karşılama gönderilir
              </p>
            </div>

            {/* Status */}
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium">
                ⚙️ Durum güncelle
              </h3>
              <div className="space-y-1.5">
                {STATUS_OPTIONS.map((s) => {
                  const active = a.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatus(s)}
                      disabled={active}
                      className={`flex w-full items-center justify-between rounded-[10px] border px-3 py-2.5 text-left text-[13px] transition ${
                        active
                          ? "border-ai-2/40 bg-ai-2/10"
                          : "border-border hover:bg-surface-2"
                      }`}
                    >
                      <span className="font-medium">{STATUS_LABEL[s]}</span>
                      {active && (
                        <Check size={14} className="text-ai-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cover letter */}
            {a.coverLetter && (
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
                <h3 className="mb-2 text-[13px] font-medium">📝 Ön yazı</h3>
                <p className="whitespace-pre-wrap text-[13px] text-text-2 leading-[1.55]">
                  {a.coverLetter}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
