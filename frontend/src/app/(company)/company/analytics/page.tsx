"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import {
  BarChart3,
  TrendingUp,
  Briefcase,
  Eye,
  Trophy,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

import { analyticsApi } from "@/lib/analytics-api";
import type { ApiError } from "@/types/auth";
import type { CompanyAnalyticsDto } from "@/types/analytics";

const FUNNEL_ORDER = ["NEW", "REVIEWING", "INTERVIEW", "OFFERED", "REJECTED"];
const FUNNEL_LABEL: Record<string, string> = {
  NEW: "Yeni",
  REVIEWING: "İnceleniyor",
  INTERVIEW: "Mülakat",
  OFFERED: "Teklif",
  REJECTED: "Reddedildi",
};
const FUNNEL_COLOR: Record<string, string> = {
  NEW: "#3b82f6",
  REVIEWING: "#8b5cf6",
  INTERVIEW: "#f59e0b",
  OFFERED: "#10b981",
  REJECTED: "#ef4444",
};

export default function CompanyAnalyticsPage() {
  const [data, setData] = useState<CompanyAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .company()
      .then(setData)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Veriler yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!data) return <div className="text-red-300">{error}</div>;

  const funnelData = FUNNEL_ORDER.map((s) => ({
    name: FUNNEL_LABEL[s],
    value: data.funnel[s] ?? 0,
    fill: FUNNEL_COLOR[s],
  }));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <BarChart3 size={12} /> ŞİRKET ANALİTİĞİ
          </div>
          <h1 className="page-head__title">
            <span className="ai-text">{data.companyName}</span> performans
          </h1>
          <p className="page-head__sub mt-1.5">
            İlanlarınızın funnel görünümü, time-to-hire ve en başarılı pozisyonlar.
          </p>
        </div>
      </div>

      {/* Top KPI tiles */}
      <div className="stats-grid">
        <StatTile
          label="AKTİF İLAN"
          value={data.activeJobs}
          icon={<Briefcase size={14} />}
        />
        <StatTile
          label="TOPLAM BAŞVURU"
          value={data.totalApplications}
          icon={<TrendingUp size={14} />}
          tone="success"
        />
        <StatTile label="TOPLAM TEKLİF" value={data.offers} icon={<Trophy size={14} />} tone="ai" />
        <StatTile
          label="ORT. TEKLİF SÜRESİ"
          value={data.avgTimeToOfferDays ? `${data.avgTimeToOfferDays.toFixed(1)}g` : "—"}
          icon={<Clock size={14} />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Funnel */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
          <h3 className="mb-1 flex items-center gap-2 text-[13px] font-medium">
            <TrendingUp size={14} className="text-text-muted" /> Hiring Funnel
          </h3>
          <p className="mb-5 text-[12.5px] text-text-2">
            Başvurular hangi aşamada — adayların yolculuğu.
          </p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" stroke="#7b7b85" fontSize={11} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#7b7b85"
                  fontSize={11}
                  width={92}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {funnelData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Applications over time */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
          <h3 className="mb-1 flex items-center gap-2 text-[13px] font-medium">
            <BarChart3 size={14} className="text-text-muted" /> Başvurular — Son 14 gün
          </h3>
          <p className="mb-5 text-[12.5px] text-text-2">
            Günlük yeni başvuru sayısı.
          </p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={data.applicationsLast14Days} margin={{ left: 0, right: 12 }}>
                <defs>
                  <linearGradient id="aiArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(218 92% 62%)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(218 92% 62%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#7b7b85"
                  fontSize={10}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis stroke="#7b7b85" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(218 92% 62%)"
                  strokeWidth={2}
                  fill="url(#aiArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top jobs */}
      <div className="mt-5 rounded-[var(--radius-lg)] border border-border bg-surface p-7">
        <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium">
          <Eye size={14} className="text-text-muted" /> En çok başvuru alan ilanlar
        </h3>
        {data.topJobs.length === 0 ? (
          <p className="text-[13px] text-text-muted">Henüz başvuru olan ilanın yok.</p>
        ) : (
          <div className="space-y-2">
            {data.topJobs.map((j, i) => (
              <Link
                key={j.jobId}
                href={`/company/jobs/${j.jobId}`}
                className="flex items-center gap-4 rounded-md border border-border bg-bg-soft p-3 transition hover:border-border-strong"
              >
                <span className="font-mono text-[11px] text-text-muted w-6">
                  #{i + 1}
                </span>
                <span className="flex-1 truncate text-[14px] font-medium">{j.title}</span>
                <span className="font-mono text-[12.5px] text-emerald-400">
                  {j.applications} başvuru
                </span>
                <span className="font-mono text-[12px] text-text-muted">
                  {j.views} görüntüleme
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "success" | "ai";
}) {
  const color =
    tone === "success"
      ? "text-emerald-400"
      : tone === "ai"
        ? "ai-text"
        : "";
  return (
    <div className="stat-tile">
      <div className="stat-tile__head">
        <span className="stat-tile__label">{label}</span>
        <span className="stat-tile__icon">{icon}</span>
      </div>
      <div className={`stat-tile__num ${color}`}>{value}</div>
    </div>
  );
}
