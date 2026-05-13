"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { BarChart3, Users, Building2, Briefcase, Brain } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { analyticsApi } from "@/lib/analytics-api";
import type { ApiError } from "@/types/auth";
import type { AdminAnalyticsDto } from "@/types/analytics";

const PLAN_COLOR: Record<string, string> = {
  FREE: "#6b7280",
  PREMIUM: "#a855f7",
  ENTERPRISE: "#3b82f6",
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .admin()
      .then(setData)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Veriler yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!data) return <div className="text-red-300">{error}</div>;

  const planData = Object.entries(data.planDistribution).map(([k, v]) => ({
    name: k,
    value: v,
    fill: PLAN_COLOR[k] ?? "#6b7280",
  }));
  const skillData = data.topSkills.map((s) => ({ name: s.skill, value: s.count }));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <BarChart3 size={12} /> SİSTEM ANALİTİĞİ
          </div>
          <h1 className="page-head__title">
            <span className="ai-text">Synapse</span> sağlık paneli
          </h1>
          <p className="page-head__sub mt-1.5">
            Platform geneli kullanıcı büyümesi, plan dağılımı ve en sık görülen yetkinlikler.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <Tile label="KULLANICI" value={data.totalUsers} icon={<Users size={14} />} />
        <Tile label="ŞİRKET" value={data.totalCompanies} icon={<Building2 size={14} />} />
        <Tile label="İLAN" value={data.totalJobs} icon={<Briefcase size={14} />} tone="success" />
        <Tile label="AI ANALİZ" value={data.totalAiAnalyses} icon={<Brain size={14} />} tone="ai" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
          <h3 className="mb-1 text-[13px] font-medium">Yeni kullanıcılar — Son 30 gün</h3>
          <p className="mb-5 text-[12.5px] text-text-2">Günlük kayıt sayısı.</p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={data.usersLast30Days} margin={{ left: 0, right: 12 }}>
                <defs>
                  <linearGradient id="usersArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(280 88% 67%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(190 85% 56%)" stopOpacity={0} />
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
                  fill="url(#usersArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
          <h3 className="mb-1 text-[13px] font-medium">Plan Dağılımı</h3>
          <p className="mb-3 text-[12.5px] text-text-2">FREE / PREMIUM / ENTERPRISE.</p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={planData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {planData.map((p) => (
                    <Cell key={p.name} fill={p.fill} stroke="var(--surface)" />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: "var(--text-2)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
          <h3 className="mb-1 text-[13px] font-medium">Top 10 Yetkinlik</h3>
          <p className="mb-3 text-[12.5px] text-text-2">CV&apos;lerde en sık geçen.</p>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={skillData} layout="vertical" margin={{ left: 12, right: 16 }}>
                <XAxis type="number" stroke="#7b7b85" fontSize={11} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#7b7b85"
                  fontSize={11}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="hsl(280 88% 60%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7 space-y-3">
          <h3 className="text-[13px] font-medium">Genel sağlık</h3>
          <Row label="Banlı kullanıcı" value={data.bannedUsers} />
          <Row label="E-posta doğrulanmış" value={`${data.verifiedEmails} / ${data.totalUsers}`} />
          <Row label="Onaylı şirket" value={`${data.verifiedCompanies} / ${data.totalCompanies}`} />
          <Row label="Aktif ilan" value={`${data.activeJobs} / ${data.totalJobs}`} />
          <Row label="Toplam başvuru" value={data.totalApplications} />
          <Row label="Yüklü CV" value={data.totalCvs} />
          <Row label="AI analiz" value={data.totalAiAnalyses} />
        </div>
      </div>
    </>
  );
}

function Tile({
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
    tone === "success" ? "text-emerald-400" : tone === "ai" ? "ai-text" : "";
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

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[13px] text-text-2">{label}</dt>
      <dd className="font-mono text-[13px] text-text">{value}</dd>
    </div>
  );
}
