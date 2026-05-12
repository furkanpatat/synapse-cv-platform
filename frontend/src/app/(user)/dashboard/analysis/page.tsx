"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import {
  Sparkles,
  Brain,
  AlertTriangle,
  Github,
  TrendingUp,
  Star,
  Check,
  X,
  Download,
  Lock,
} from "lucide-react";

import { analysisApi } from "@/lib/analysis-api";
import { billingApi } from "@/lib/billing-api";
import { Button } from "@/components/ui/Button";
import { QuotaBanner } from "@/components/QuotaBanner";
import type { ApiError } from "@/types/auth";
import type { BillingMeResponse } from "@/types/billing";
import type {
  AnalysisReport,
  Inconsistency,
  SkillScore,
} from "@/types/analysis";

type Phase = "loading-initial" | "empty" | "running" | "result";

const LOADING_STEPS = [
  "CV verilerini okuyorum...",
  "GitHub commit geçmişini analiz ediyorum...",
  "Yetkinlik haritası çıkarılıyor...",
  "Tutarsızlıklar denetleniyor...",
  "Skor hesaplanıyor...",
];

export default function AnalysisPage() {
  const [phase, setPhase] = useState<Phase>("loading-initial");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [billing, setBilling] = useState<BillingMeResponse | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    billingApi.me().then(setBilling).catch(() => setBilling(null));
  }, []);

  useEffect(() => {
    analysisApi
      .me()
      .then((r) => {
        setReport(r);
        setPhase("result");
      })
      .catch((err: AxiosError<ApiError>) => {
        if (err.response?.status === 404) {
          setPhase("empty");
        } else {
          setError(err.response?.data?.message ?? "Hata");
          setPhase("empty");
        }
      });
  }, []);

  // Cycle loading steps while running
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setStepIdx((i) => (i + 1) % LOADING_STEPS.length);
    }, 2400);
    return () => clearInterval(id);
  }, [phase]);

  const start = async () => {
    setError(null);
    setQuotaMessage(null);
    setPhase("running");
    setStepIdx(0);
    try {
      const r = await analysisApi.start();
      setReport(r);
      setPhase("result");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      if (e.response?.status === 402 || e.response?.data?.code === "QUOTA_EXCEEDED") {
        setQuotaMessage(
          e.response?.data?.message ?? "Aylık AI analiz kotanı aştın. PREMIUM'a yükselt."
        );
      } else {
        setError(e.response?.data?.message ?? "Analiz başarısız");
      }
      setPhase(report ? "result" : "empty");
    }
  };

  const handlePdf = async () => {
    setDownloading(true);
    try {
      await analysisApi.downloadPdf();
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      if (e.response?.status === 402) {
        setQuotaMessage(
          e.response?.data?.message ??
            "PDF rapor indirme PREMIUM özelliğidir."
        );
      } else {
        setError(e.response?.data?.message ?? "PDF indirilemedi");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageHead
        phase={phase}
        onRun={start}
        hasReport={!!report}
        isPremium={billing?.isPremium ?? false}
        onPdf={handlePdf}
        downloading={downloading}
      />

      {quotaMessage && (
        <div className="mb-6">
          <QuotaBanner message={quotaMessage} />
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {phase === "loading-initial" && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-20 text-center text-sm text-text-muted">
          Yükleniyor...
        </div>
      )}

      {phase === "empty" && <EmptyState onRun={start} />}

      {phase === "running" && <LoadingState step={LOADING_STEPS[stepIdx]} />}

      {phase === "result" && report && <ResultView report={report} />}
    </>
  );
}

/* ---------- Page head ---------- */
function PageHead({
  phase,
  onRun,
  hasReport,
  isPremium,
  onPdf,
  downloading,
}: {
  phase: Phase;
  onRun: () => void;
  hasReport: boolean;
  isPremium: boolean;
  onPdf: () => void;
  downloading: boolean;
}) {
  const showPdf = phase === "result" && hasReport;
  return (
    <div className="page-head">
      <div>
        <div className="page-head__crumbs">
          <Sparkles size={12} /> YETKİNLİK ANALİZİ
        </div>
        <h1 className="page-head__title">
          <span className="ai-text">AI</span> yetkinlik raporu
        </h1>
        <p className="page-head__sub mt-1.5">
          CV&apos;ndeki yetkinlikleri GitHub aktivitenle eşleştirir, 0-100 arası tek bir skor üretir.
        </p>
      </div>
      <div className="page-head__actions">
        {showPdf &&
          (isPremium ? (
            <Button onClick={onPdf} variant="outline" size="lg" loading={downloading}>
              <Download size={15} /> PDF indir
            </Button>
          ) : (
            <Link
              href="/dashboard/billing"
              className="btn btn--outline btn--lg"
              title="PDF indirme PREMIUM özelliğidir"
            >
              <Lock size={14} /> PDF — PREMIUM
            </Link>
          ))}
        <Button onClick={onRun} variant="ai" size="lg" disabled={phase === "running"}>
          <Sparkles size={15} />
          {phase === "running" ? "Analiz ediliyor..." : hasReport ? "Yeniden çalıştır" : "Analizi başlat"}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Empty ---------- */
function EmptyState({ onRun }: { onRun: () => void }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-12 text-center">
      <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full ai-grad shadow-[0_24px_48px_-16px_hsla(218,92%,55%,0.5)]">
        <Brain size={32} className="text-white" />
      </div>
      <h2 className="text-[24px] font-semibold tracking-[-0.025em]">
        İlk <span className="ai-text">AI analizini</span> başlat
      </h2>
      <p className="mx-auto mt-3 max-w-[460px] text-[14px] text-text-2">
        CV&apos;ndeki yetkinliklerin GitHub aktivitenle uyumlu mu? Saniyeler içinde
        yapılandırılmış bir rapor üretelim.
      </p>

      <ul className="mx-auto mt-6 inline-flex flex-col gap-2 text-left text-[13px] text-text-2">
        <li className="flex items-center gap-2">
          <Check size={14} className="text-emerald-400" /> CV ve GitHub bağlı olmalı
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-emerald-400" /> Yaklaşık 30-60 sn sürer
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-emerald-400" /> FREE planda ayda 1 hak
        </li>
      </ul>

      <div className="mt-8 flex justify-center gap-2">
        <Button onClick={onRun} variant="ai" size="lg">
          <Sparkles size={15} /> Analizi başlat
        </Button>
        <Link href="/dashboard/cv" className="btn btn--outline btn--lg">
          Önce CV yükle
        </Link>
      </div>
    </div>
  );
}

/* ---------- Loading ---------- */
function LoadingState({ step }: { step: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-20 text-center">
      <div className="loading-orb">
        <div className="loading-orb__glow" />
        <div className="loading-orb__ring" />
        <div className="loading-orb__core" />
      </div>
      <h2 className="text-[22px] font-semibold tracking-[-0.025em]">
        AI <span className="ai-text">çalışıyor</span>
      </h2>
      <div className="mb-7 mt-3 min-h-[20px] font-mono text-[13px] text-text-2 transition-all">
        <span className="text-ai-2 mr-2">&gt;</span>
        {step}
      </div>
      <div className="loading-progress">
        <div className="loading-progress__fill" />
      </div>
    </div>
  );
}

/* ---------- Result ---------- */
function ResultView({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-6">
      <ScoreHero report={report} />
      <SummaryCard summary={report.summary} skillCount={report.skillScores.length} inconCount={report.inconsistencies.length} />
      <SkillsCard skills={report.skillScores} />
      {report.inconsistencies.length > 0 && <InconsistenciesCard items={report.inconsistencies} />}
      <GithubEvidence report={report} />
    </div>
  );
}

function ScoreHero({ report }: { report: AnalysisReport }) {
  const score = report.overallScore ?? 0;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1600;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const verdict = score >= 80 ? "GÜÇLÜ ADAY" : score >= 60 ? "UMUT VERİCİ" : score >= 40 ? "ORTA DÜZEY" : "GELİŞTİRMELİ";

  // Build pillars from analysis data
  const skills = report.skillScores ?? [];
  const high = skills.filter((s) => s.confidence === "HIGH");
  const mid = skills.filter((s) => s.confidence === "MEDIUM");
  const yetkinlikAvg = skills.length
    ? Math.round(skills.reduce((s, x) => s + x.score, 0) / skills.length)
    : 0;
  const githubScore = Math.min(
    100,
    Math.round((report.github?.publicRepos ?? 0) * 4 + (report.github?.totalStars ?? 0) * 2)
  );
  const consistency = skills.length
    ? Math.round(((high.length + mid.length * 0.5) / skills.length) * 100)
    : 0;
  const confidence = skills.length
    ? Math.round((high.length / skills.length) * 100)
    : 0;

  return (
    <div className="card--grad-border">
      <div className="card__inner">
        <div className="score-hero">
          <div
            className="score-big"
            style={{ "--score": animated } as React.CSSProperties}
          >
            <div className="score-big__glow" />
            <div className="score-big__ring-outer" />
            <div className="score-big__progress" />
            <div className="score-big__inner">
              <div>
                <div>
                  <span className="score-big__num">{animated}</span>
                  <span className="score-big__suffix">/100</span>
                </div>
                <div className="score-big__label">YETKİNLİK SKORU</div>
              </div>
            </div>
            <span className="score-big__verdict">
              <Sparkles size={11} /> {verdict}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.025em]">
                @{report.githubUsername}
              </h2>
              <p className="text-text-muted text-[13.5px]">
                {report.github?.publicRepos ?? 0} public repo · {report.github?.totalStars ?? 0} yıldız
              </p>
            </div>
            <div className="space-y-2.5">
              <Pillar label="Yetkinlik" value={yetkinlikAvg} />
              <Pillar label="GitHub kanıtı" value={githubScore} />
              <Pillar label="Tutarlılık" value={consistency} />
              <Pillar label="Güven" value={confidence} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pillar({ label, value }: { label: string; value: number }) {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setFilled(value), 400);
    return () => clearTimeout(id);
  }, [value]);
  return (
    <div className="pillar">
      <span className="pillar__name">{label}</span>
      <div className="pillar__bar">
        <div className="pillar__fill" style={{ width: `${filled}%` }} />
      </div>
      <span className="pillar__val">{value}</span>
    </div>
  );
}

/* ---------- Summary card with typing reveal ---------- */
function SummaryCard({
  summary,
  skillCount,
  inconCount,
}: {
  summary: string;
  skillCount: number;
  inconCount: number;
}) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setText("");
    setDone(false);
    if (!summary) {
      setDone(true);
      return;
    }
    const id = setInterval(() => {
      indexRef.current += 2;
      if (indexRef.current >= summary.length) {
        setText(summary);
        setDone(true);
        clearInterval(id);
      } else {
        setText(summary.slice(0, indexRef.current));
      }
    }, 16);
    return () => clearInterval(id);
  }, [summary]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-medium">
          <Sparkles size={14} className="text-ai-2" /> AI ÖZETİ
        </h3>
      </div>
      <p
        className={`summary__body ${done ? "" : "summary__body--typing"}`}
      >
        {text}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
        <span className="pill pill--success">
          <Check size={12} /> {skillCount} yetkinlik
        </span>
        <span className="pill pill--ai">
          <Github size={12} /> GitHub kanıtı
        </span>
        {inconCount > 0 && (
          <span className="pill pill--danger">
            <AlertTriangle size={12} /> {inconCount} tutarsızlık
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Skills card ---------- */
function SkillsCard({ skills }: { skills: SkillScore[] }) {
  if (skills.length === 0) return null;
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-medium">
          <TrendingUp size={14} className="text-text-muted" /> Yetkinlik dökümü
        </h3>
        <span className="font-mono text-[11.5px] text-text-2">
          {skills.length} skill
        </span>
      </div>
      <div className="flex flex-col">
        {skills.map((s, i) => (
          <SkillRow key={s.skill + i} skill={s} delayMs={i * 60} />
        ))}
      </div>
    </div>
  );
}

function SkillRow({ skill, delayMs }: { skill: SkillScore; delayMs: number }) {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setFilled(skill.score), 300 + delayMs);
    return () => clearTimeout(id);
  }, [skill.score, delayMs]);

  const tone = skill.confidence === "HIGH" ? "high" : skill.confidence === "MEDIUM" ? "med" : "low";
  const label = skill.confidence === "HIGH" ? "Yüksek" : skill.confidence === "MEDIUM" ? "Orta" : "Düşük";

  return (
    <div className="skill-row">
      <div className="skill-row__name">
        <span className="truncate">{skill.skill}</span>
      </div>
      <div className="skill-row__bar">
        <div
          className={`skill-row__fill skill-row__fill--${tone}`}
          style={{ width: `${filled}%` }}
        />
      </div>
      <div className="skill-row__meta">
        <span className={`skill-row__chip skill-row__chip--${tone}`}>{label}</span>
        <span className="skill-row__pct">{skill.score}</span>
      </div>
    </div>
  );
}

/* ---------- Inconsistencies ---------- */
function InconsistenciesCard({ items }: { items: Inconsistency[] }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-medium">
          <AlertTriangle size={14} className="text-red-400" /> Tutarsızlıklar
        </h3>
        <span className="font-mono text-[11.5px] text-text-2">
          {items.length} adet
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((i, idx) => (
          <div key={idx} className="incon">
            <div className="incon__icon">
              <X size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-medium tracking-[-0.01em]">{i.claimedSkill}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-red-400 bg-red-500/10 rounded px-1.5 py-0.5">
                  {i.severity}
                </span>
              </div>
              <p className="text-[13px] text-text-2 leading-[1.55]">{i.issue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- GitHub evidence ---------- */
function GithubEvidence({ report }: { report: AnalysisReport }) {
  const gh = report.github;
  if (!gh) return null;

  const langs = Object.entries(gh.languageBytes ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalBytes = langs.reduce((s, [, v]) => s + v, 0) || 1;
  const langColors = ["#3b82f6", "#a855f7", "#22d3ee", "#f59e0b", "#10b981"];

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-medium">
          <Github size={14} className="text-text-muted" /> GitHub kanıtı
        </h3>
        <a
          href={`https://github.com/${report.githubUsername}`}
          target="_blank"
          rel="noreferrer"
          className="text-[12.5px] text-text-2 hover:text-text font-mono"
        >
          @{report.githubUsername} ↗
        </a>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            Public repo
          </div>
          <div className="gh-stat__num mt-1.5">{gh.publicRepos ?? 0}</div>
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            Toplam yıldız
          </div>
          <div className="gh-stat__num mt-1.5 inline-flex items-center gap-2">
            {gh.totalStars ?? 0}
            <Star size={20} className="text-amber-400" fill="currentColor" />
          </div>
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            Hesap
          </div>
          <div className="mt-1.5 text-[16px] font-mono">
            {gh.accountCreatedAt ? new Date(gh.accountCreatedAt).getFullYear() : "—"}
          </div>
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            Son aktivite
          </div>
          <div className="mt-1.5 text-[13px] font-mono">
            {gh.lastActivityAt
              ? new Date(gh.lastActivityAt).toLocaleDateString("tr-TR")
              : "—"}
          </div>
        </div>
      </div>

      {langs.length > 0 && (
        <div className="mt-7">
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-2.5">
            Dil dağılımı
          </div>
          <div className="gh-lang-bar">
            {langs.map(([name, bytes], i) => (
              <div
                key={name}
                style={{
                  width: `${(bytes / totalBytes) * 100}%`,
                  background: langColors[i],
                }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11.5px] text-text-2">
            {langs.map(([name, bytes], i) => (
              <span key={name} className="inline-flex items-center gap-2 font-mono">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ background: langColors[i] }}
                />
                {name} {Math.round((bytes / totalBytes) * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {gh.topRepos && gh.topRepos.length > 0 && (
        <div className="mt-7">
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-3">
            Öne çıkan repo&apos;lar
          </div>
          <div className="flex flex-col gap-2">
            {gh.topRepos.slice(0, 5).map((r) => (
              <div
                key={r.name}
                className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-bg-soft px-3 py-2.5 transition hover:border-border-strong hover:bg-surface-2"
              >
                <span className="font-medium tracking-[-0.01em]">{r.name}</span>
                {r.primaryLanguage && (
                  <span className="font-mono text-[11.5px] text-text-2 ml-auto">
                    {r.primaryLanguage}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-mono text-[12px] text-text-2">
                  <Star size={11} /> {r.stars ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
