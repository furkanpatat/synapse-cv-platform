"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Briefcase,
  ArrowRight,
  FileText,
  Brain,
  Inbox,
  MessageSquare,
  Crown,
  Target,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { analysisApi } from "@/lib/analysis-api";
import { userJobsApi } from "@/lib/jobs-user-api";
import { billingApi } from "@/lib/billing-api";
import type { AnalysisReport } from "@/types/analysis";
import type { ApplicationResponse, JobResponse } from "@/types/jobs";
import type { BillingMeResponse } from "@/types/billing";

const WEEKDAY = ["PAZAR", "PAZARTESİ", "SALI", "ÇARŞAMBA", "PERŞEMBE", "CUMA", "CUMARTESİ"];
const MONTH = [
  "OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN",
  "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK",
];

const TR_STATUS: Record<string, string> = {
  NEW: "Yeni",
  REVIEWING: "İncelemede",
  INTERVIEW: "Mülakat",
  OFFERED: "Teklif",
  REJECTED: "Reddedildi",
};

function mapStatusToTone(s: string): "review" | "accepted" | "pending" | "rejected" {
  if (s === "REVIEWING" || s === "INTERVIEW") return "review";
  if (s === "OFFERED") return "accepted";
  if (s === "REJECTED") return "rejected";
  return "pending";
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [billing, setBilling] = useState<BillingMeResponse | null>(null);

  useEffect(() => {
    analysisApi.me().then(setAnalysis).catch(() => setAnalysis(null));
    userJobsApi.recommended(4).then(setJobs).catch(() => setJobs([]));
    userJobsApi.myApplications().then((a) => setApps(a.slice(0, 4))).catch(() => setApps([]));
    billingApi.me().then(setBilling).catch(() => setBilling(null));
  }, []);

  const today = new Date();
  const dateLabel = `${WEEKDAY[today.getDay()]} · ${today.getDate()} ${MONTH[today.getMonth()]}`;

  return (
    <>
      {/* Hello hero */}
      <div className="hello-grid">
        <div className="hello-card">
          <div className="page-head__crumbs mb-3">
            <Sparkles size={12} />
            {dateLabel}
          </div>
          <h1 className="page-head__title">
            Merhaba <span className="ai-text">{user?.firstName ?? "yolcu"}</span>
            {jobs.length > 0
              ? `, bugün ${jobs.length} yeni uygun ilan var.`
              : ". AI ile yetkinliklerini doğrulamaya hazır mısın?"}
          </h1>
          <p className="page-head__sub mt-2 max-w-[580px]">
            {analysis
              ? "AI skorun güncel. CV'ni güncellersen daha çok uyumlu rol yakalayabilirsin."
              : "Önce CV'ni yükle ve GitHub profilini bağla — AI yetkinliklerini saniyeler içinde değerlendirir."}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/dashboard/analysis" className="btn btn--ai btn--lg">
              <Sparkles size={15} />
              {analysis ? "Yeni analiz" : "İlk analizini başlat"}
            </Link>
            <Link href="/dashboard/jobs" className="btn btn--outline btn--lg">
              <Briefcase size={14} /> İlanlara göz at
            </Link>
          </div>
        </div>

        <ScoreSidePanel analysis={analysis} />
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[13px] font-medium">
          <Target size={14} className="text-text-muted" /> Hızlı işlemler
        </h2>
      </div>

      <div className="qa-grid mb-8">
        <QaCard
          href="/dashboard/cv"
          icon={<FileText size={18} />}
          title="CV'm"
          sub="Yapılandırılmış veri + skor"
          foot="Yüklemek için tıkla"
          badge={{ label: "CV", tone: "success" }}
        />
        <QaCard
          href="/dashboard/analysis"
          icon={<Brain size={18} />}
          title="AI Analiz"
          sub="Yetkinliklerini doğrulat"
          foot={analysis ? "Skor güncel" : "Henüz analiz yok"}
          badge={{
            label: analysis ? `${analysis.overallScore ?? 0}/100` : "BAŞLA",
            tone: "ai",
          }}
          ai
        />
        <QaCard
          href="/dashboard/jobs"
          icon={<Briefcase size={18} />}
          title="İlanlar"
          sub={`${jobs.length} öneri bekliyor`}
          foot="Filtre + öneriler"
          badge={{ label: `+${jobs.length}`, tone: "warning" }}
        />
        <QaCard
          href="/dashboard/applications"
          icon={<Inbox size={18} />}
          title="Başvurularım"
          sub={`Aktif ${apps.length} başvuru`}
          foot={apps[0] ? `Son: ${apps[0].jobTitle}` : "Henüz başvuru yok"}
          badge={{ label: String(apps.length), tone: "warning" }}
        />
        <QaCard
          href="/dashboard/messages"
          icon={<MessageSquare size={18} />}
          title="Mesajlar"
          sub="İşveren konuşmaları"
          foot="Şirketlerle doğrudan iletişim"
          badge={{ label: "0", tone: "ai" }}
        />
        <QaCard
          href="/dashboard/billing"
          icon={<Crown size={18} />}
          title="Abonelik"
          sub={billing ? `${billing.plan} planı` : "Plan ve kullanım"}
          foot={
            billing
              ? billing.isPremium
                ? "Sınırsız kullanım"
                : `AI: ${billing.aiAnalysisLast30d.current}/${billing.aiAnalysisLast30d.limit}`
              : "Yükle"
          }
          badge={{
            label: billing?.isPremium ? "PREMIUM" : "FREE",
            tone: billing?.isPremium ? "ai" : "warning",
          }}
        />
      </div>

      {/* Split: jobs + applications timeline */}
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Sana önerilen ilanlar"
          icon={<Sparkles size={14} />}
          moreHref="/dashboard/jobs"
        >
          {jobs.length === 0 ? (
            <EmptyState text="Henüz öneri yok. CV'ni yükle ve GitHub bağla, AI sana uygun ilanları getirsin." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {jobs.slice(0, 4).map((j) => (
                <JobMiniRow key={j.id} job={j} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Son başvurular"
          icon={<Inbox size={14} />}
          moreHref="/dashboard/applications"
        >
          {apps.length === 0 ? (
            <EmptyState text="Henüz başvuru yok. İlanlara göz at ve hızlı başvur." />
          ) : (
            <div className="timeline">
              {apps.map((a) => {
                const tone = mapStatusToTone(a.status);
                return (
                  <div key={a.id} className="tl">
                    <div className={`tl__dot tl__dot--${tone}`} />
                    <div>
                      <div className="tl__title">{a.jobTitle}</div>
                      <div className="tl__meta">
                        {new Date(a.appliedAt).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    <span className={`tl__status tl__status--${tone}`}>
                      {TR_STATUS[a.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}

function ScoreSidePanel({ analysis }: { analysis: AnalysisReport | null }) {
  if (!analysis) {
    return (
      <div className="score-widget">
        <div className="score-widget__inner">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted mb-3 flex items-center gap-1.5">
            <Sparkles size={12} className="text-ai-2" /> SON AI SKORU
          </div>
          <div className="flex items-center gap-3">
            <ScoreRing score={0} size="md" label="—" animate={false} />
            <p className="text-[13px] text-text-2">
              CV ve GitHub'ı bağla, ilk analizini başlat.
            </p>
          </div>
          <Link href="/dashboard/analysis" className="btn btn--ai btn--sm mt-auto" style={{ marginTop: "auto" }}>
            <Sparkles size={13} /> Analizi başlat
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="score-widget">
      <div className="score-widget__inner">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted flex items-center gap-1.5">
            <Sparkles size={12} className="text-ai-2" /> SON AI SKORU
          </span>
          <span className="font-mono text-xs text-emerald-400">@{analysis.githubUsername}</span>
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing score={analysis.overallScore ?? 0} size="md" />
          <div className="min-w-0">
            <div className="font-mono text-[12px] text-text-muted">YETKİNLİK</div>
            <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-text-2">
              {analysis.summary?.split(".")[0]}.
            </p>
          </div>
        </div>
        <Link href="/dashboard/analysis" className="btn btn--ai btn--sm mt-5">
          <Sparkles size={13} /> Raporu aç
        </Link>
      </div>
    </div>
  );
}

function QaCard({
  href,
  icon,
  title,
  sub,
  foot,
  badge,
  ai,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  foot: string;
  badge: { label: string; tone: "success" | "warning" | "ai" };
  ai?: boolean;
}) {
  return (
    <Link href={href} className={`qa ${ai ? "qa--ai" : ""}`}>
      <div className="qa__icon">{icon}</div>
      <div className="qa__title">{title}</div>
      <div className="qa__sub">{sub}</div>
      <div className="qa__foot">
        <span className="truncate">{foot}</span>
        <span className={`qa__badge qa__badge--${badge.tone}`}>{badge.label}</span>
      </div>
    </Link>
  );
}

function SectionCard({
  title,
  icon,
  moreHref,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  moreHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-medium">
          {icon} {title}
        </h3>
        {moreHref && (
          <Link
            href={moreHref}
            className="text-[12.5px] text-text-2 hover:text-text inline-flex items-center gap-1"
          >
            Tümünü gör <ArrowRight size={13} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function JobMiniRow({ job }: { job: JobResponse }) {
  const initials = job.companyName.charAt(0).toUpperCase();
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const color = colors[job.companyName.charCodeAt(0) % colors.length];
  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className="grid grid-cols-[40px_1fr_auto] items-center gap-3.5 rounded-xl border border-border bg-bg-soft p-3.5 transition hover:border-border-strong hover:bg-surface-2 hover:-translate-y-0.5"
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-[10px] text-[13px] font-semibold text-white"
        style={{ background: color }}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-medium tracking-[-0.01em] truncate">{job.title}</div>
        <div className="text-[12px] text-text-muted font-mono tracking-[0.02em]">
          {job.companyName} · {[job.city, job.remoteType].filter(Boolean).join(" · ")}
        </div>
      </div>
      <span className="font-mono text-[12.5px] text-ai-3">→</span>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-[13px] text-text-muted">
      {text}
    </div>
  );
}
