"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Briefcase,
  Inbox,
  TrendingUp,
  Eye,
  Plus,
  ArrowRight,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { companyApi } from "@/lib/company-api";
import type { CompanyResponse, JobResponse } from "@/types/jobs";

export default function CompanyHomePage() {
  const user = useAuthStore((s) => s.user);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [jobs, setJobs] = useState<JobResponse[]>([]);

  useEffect(() => {
    companyApi.getMyCompany().then(setCompany).catch(() => {});
    companyApi.listJobs().then(setJobs).catch(() => {});
  }, []);

  const activeJobs = jobs.filter((j) => j.status === "ACTIVE");
  const draftJobs = jobs.filter((j) => j.status === "DRAFT");
  const totalApps = jobs.reduce((sum, j) => sum + j.applicationCount, 0);
  const totalViews = jobs.reduce((sum, j) => sum + (j.viewCount ?? 0), 0);

  return (
    <>
      <div className="hello-grid">
        <div className="hello-card">
          <div className="page-head__crumbs mb-3">
            <Sparkles size={12} /> ŞİRKET PANELİ
          </div>
          <h1 className="page-head__title">
            Merhaba <span className="ai-text">{user?.firstName ?? company?.name ?? ""}</span>,{" "}
            {totalApps} başvuru seni bekliyor.
          </h1>
          <p className="page-head__sub mt-2 max-w-[580px]">
            {company && !company.verified
              ? "Şirket hesabın admin onayını bekliyor. Onay alınana kadar ilan yayınlayamazsın."
              : "Aktif ilanlarındaki adayları AI sıralamasıyla incele, mesajlaşmaya başla."}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/company/jobs/new" className="btn btn--ai btn--lg">
              <Plus size={15} /> Yeni ilan
            </Link>
            <Link href="/company/jobs" className="btn btn--outline btn--lg">
              <Briefcase size={14} /> İlanlarımı yönet
            </Link>
          </div>
        </div>

        <div className="score-widget">
          <div className="score-widget__inner">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted flex items-center gap-1.5">
                <TrendingUp size={12} className="text-ai-2" /> HAVUZ SAĞLIĞI
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <Metric label="AKTİF" value={activeJobs.length} />
              <Metric label="TASLAK" value={draftJobs.length} />
              <Metric label="BAŞVURU" value={totalApps} />
              <Metric label="GÖRÜNTÜLEME" value={totalViews} />
            </div>
            <Link href="/company/profile" className="btn btn--outline btn--sm mt-5">
              {company?.verified ? "✓ Onaylı şirket" : "⏳ Onay bekleniyor"}
            </Link>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatTile
          label="AKTİF İLAN"
          value={activeJobs.length}
          icon={<Briefcase size={14} />}
          delta={`${draftJobs.length} taslak hazır`}
        />
        <StatTile
          label="TOPLAM BAŞVURU"
          value={totalApps}
          icon={<Inbox size={14} />}
          delta={`${activeJobs.length} aktif ilana`}
          deltaUp
        />
        <StatTile
          label="YÜKSEK SKOR"
          value={jobs.length ? "—" : "0"}
          icon={<TrendingUp size={14} />}
          delta="AI sıralaması"
        />
        <StatTile
          label="GÖRÜNTÜLENME"
          value={totalViews}
          icon={<Eye size={14} />}
          delta="Son 30 gün"
          deltaUp
        />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[13px] font-medium">
            <Briefcase size={14} className="text-text-muted" /> Aktif ilanlar
          </h3>
          <Link
            href="/company/jobs"
            className="text-[12.5px] text-text-2 hover:text-text inline-flex items-center gap-1"
          >
            Tümü <ArrowRight size={13} />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong p-8 text-center text-[13px] text-text-muted">
            Henüz ilan oluşturmadın.{" "}
            <Link href="/company/jobs/new" className="text-text border-b border-border-strong">
              İlk ilanını oluştur →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col">
            {jobs.slice(0, 6).map((j) => (
              <Link
                key={j.id}
                href={`/company/jobs/${j.id}`}
                className="job-row hover:bg-surface-2 transition rounded-md -mx-2 px-2"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium tracking-[-0.01em] truncate">
                    {j.title}
                  </div>
                  <div className="text-[12px] text-text-muted font-mono">
                    {[j.city, j.remoteType, j.level].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <span
                  className={`job-row__pill ${j.status === "ACTIVE" ? "job-row__pill--live" : ""}`}
                >
                  {j.status === "ACTIVE" ? "YAYINDA" : j.status === "DRAFT" ? "TASLAK" : "KAPALI"}
                </span>
                <span className="font-mono text-[12.5px] min-w-[70px] text-right">
                  {j.applicationCount} başvuru
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tracking-[-0.03em]">{value}</div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  delta,
  deltaUp,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  delta: string;
  deltaUp?: boolean;
}) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__head">
        <span className="stat-tile__label">{label}</span>
        <span className="stat-tile__icon">{icon}</span>
      </div>
      <div className="stat-tile__num">{value}</div>
      <div className={`text-[12px] ${deltaUp ? "stat-tile__delta--up" : "text-text-2"}`}>
        {delta}
      </div>
    </div>
  );
}
