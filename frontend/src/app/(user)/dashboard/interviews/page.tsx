"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { Video, Calendar, Clock, ArrowRight, Download, Sparkles, ThumbsUp, ThumbsDown, Meh } from "lucide-react";

import { interviewApi, downloadIcs } from "@/lib/interview-api";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";
import type { InterviewDto } from "@/types/interview";

export default function UserInterviewsPage() {
  const [list, setList] = useState<InterviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    interviewApi
      .mine()
      .then(setList)
      .catch((err: AxiosError<ApiError>) =>
        setError(err.response?.data?.message ?? "Yükleme başarısız")
      )
      .finally(() => setLoading(false));
  }, []);

  return <InterviewListView list={list} loading={loading} error={error} viewer="USER" />;
}

export function InterviewListView({
  list,
  loading,
  error,
  viewer,
}: {
  list: InterviewDto[];
  loading: boolean;
  error: string | null;
  viewer: "USER" | "COMPANY";
}) {
  const upcoming = list.filter(
    (i) => i.status === "SCHEDULED" || i.status === "STARTED"
  );
  const past = list.filter((i) => i.status === "ENDED" || i.status === "CANCELLED");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Video size={12} /> VİDEO MÜLAKATLAR
          </div>
          <h1 className="page-head__title">
            {upcoming.length > 0 ? (
              <>
                <span className="ai-text">{upcoming.length}</span> yaklaşan görüşme
              </>
            ) : (
              <>Mülakatlarım</>
            )}
          </h1>
          <p className="page-head__sub mt-1.5">
            Tarayıcıda peer-to-peer video — Zoom gerekmez. Kamera + mikrofon izni iste.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Yükleniyor...</p>
      ) : list.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong p-16 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl ai-grad text-white">
            <Video size={24} />
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.025em]">
            Henüz mülakat yok
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] text-text-2">
            {viewer === "USER"
              ? "Şirket mülakat planladığında burada görünür ve bildirim alırsın."
              : "Aday detayından 'Video mülakat planla' diyerek başlatabilirsin."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                Yaklaşanlar ({upcoming.length})
              </h2>
              <div className="space-y-2.5">
                {upcoming.map((i) => (
                  <Card key={i.id} interview={i} viewer={viewer} active />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                Geçmiş ({past.length})
              </h2>
              <div className="space-y-2.5">
                {past.map((i) => (
                  <Card key={i.id} interview={i} viewer={viewer} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function Card({
  interview,
  viewer,
  active,
}: {
  interview: InterviewDto;
  viewer: "USER" | "COMPANY";
  active?: boolean;
}) {
  const dt = new Date(interview.scheduledAt);
  const otherName =
    viewer === "USER" ? interview.companyName : interview.candidateName;
  const tone =
    interview.status === "STARTED"
      ? "tl__dot--accepted"
      : interview.status === "SCHEDULED"
        ? "tl__dot--review"
        : interview.status === "ENDED"
          ? "tl__dot--pending"
          : "tl__dot--rejected";

  const handleIcs = () => {
    downloadIcs(interview, window.location.origin);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border bg-surface p-4 ${
        active ? "border-ai-2/40" : "border-border"
      }`}
    >
      <span className={`tl__dot ${tone}`} style={{ marginTop: 0 }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium tracking-[-0.01em]">{interview.jobTitle}</h3>
          <span className="pill" style={{ fontSize: 11 }}>
            {interview.status}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[12px] text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={11} />{" "}
            {dt.toLocaleString("tr-TR", {
              weekday: "short",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={11} /> {interview.durationMin} dk
          </span>
          <span>{viewer === "USER" ? "🏢 " : "👤 "}{otherName}</span>
        </div>
        {interview.aiEvaluatedAt && (
          <AiVerdict
            score={interview.aiOverallScore ?? 0}
            recommendation={interview.aiRecommendation}
            summary={interview.aiSummary}
            strengths={interview.aiStrengths}
            gaps={interview.aiGaps}
            viewer={viewer}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        {active && (
          <button type="button" onClick={handleIcs} className="btn btn--outline btn--sm">
            <Download size={12} /> .ics
          </button>
        )}
        {active && interview.status !== "ENDED" && (
          <Link
            href={`/interview/${interview.roomToken}`}
            className="btn btn--ai btn--sm"
          >
            <Video size={12} /> Odaya gir <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

function AiVerdict({
  score,
  recommendation,
  summary,
  strengths,
  gaps,
  viewer,
}: {
  score: number;
  recommendation: "HIRE" | "MAYBE" | "PASS" | null;
  summary: string | null;
  strengths: string[] | null;
  gaps: string[] | null;
  viewer: "USER" | "COMPANY";
}) {
  const reco = recommendation ?? "MAYBE";
  const icon =
    reco === "HIRE" ? (
      <ThumbsUp size={11} className="text-emerald-400" />
    ) : reco === "PASS" ? (
      <ThumbsDown size={11} className="text-red-400" />
    ) : (
      <Meh size={11} className="text-amber-400" />
    );
  const label =
    reco === "HIRE" ? "İŞE AL" : reco === "PASS" ? "GEÇİLEBİLİR" : "BELKİ";
  return (
    <div className="mt-3 rounded-md border border-ai-2/30 bg-ai-2/5 p-3">
      <div className="mb-1 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ai-2">
        <Sparkles size={11} /> AI DEĞERLENDİRMESİ · {score}/100 · {icon} {label}
      </div>
      {summary && (
        <p className="text-[12.5px] leading-snug text-text-2">{summary}</p>
      )}
      {viewer === "COMPANY" && (strengths?.length || gaps?.length) ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 text-[12px]">
          {strengths && strengths.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400">
                Güçlü
              </div>
              <ul className="mt-1 space-y-0.5 text-text-2">
                {strengths.slice(0, 3).map((s, k) => (
                  <li key={k}>+ {s}</li>
                ))}
              </ul>
            </div>
          )}
          {gaps && gaps.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-400">
                Eksik
              </div>
              <ul className="mt-1 space-y-0.5 text-text-2">
                {gaps.slice(0, 3).map((s, k) => (
                  <li key={k}>! {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
