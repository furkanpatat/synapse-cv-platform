"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import {
  Github,
  Search,
  Star,
  GitFork,
  Clock,
  Sparkles,
  TrendingUp,
  ExternalLink,
  Calendar,
  Lock,
  Plug,
  Unplug,
  Check,
} from "lucide-react";

import {
  githubAnalyzeApi,
  type GithubAnalyzeResponse,
  type RepoSummary,
} from "@/lib/github-analyze-api";
import { githubConnectApi, type GithubConnectStatus } from "@/lib/github-connect-api";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/types/auth";

export default function GithubAnalyzePage() {
  return (
    <Suspense fallback={null}>
      <GithubAnalyzePageInner />
    </Suspense>
  );
}

function GithubAnalyzePageInner() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<GithubAnalyzeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connect, setConnect] = useState<GithubConnectStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const searchParams = useSearchParams();

  // Load connect status on mount + react to the ?connected=1 / ?connectError=...
  // query params we get redirected to after the OAuth bounce.
  useEffect(() => {
    githubConnectApi.status().then(setConnect).catch(() => setConnect(null));
    const connected = searchParams.get("connected");
    const err = searchParams.get("connectError");
    if (connected === "1") {
      toast.ai(
        "🔗 GitHub bağlandı",
        "Artık kendi private repolarını da analize dahil edebilirsin."
      );
      // Auto-fill the search box with their connected login.
      githubConnectApi.status().then((s) => {
        setConnect(s);
        if (s.login) setInput(s.login);
      });
    } else if (err) {
      toast.error("GitHub bağlantısı başarısız", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startConnect = async () => {
    setConnecting(true);
    try {
      const url = await githubConnectApi.start();
      window.location.href = url;
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      toast.error("Bağlantı başlatılamadı", e.response?.data?.message ?? "");
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await githubConnectApi.disconnect();
      setConnect({ connected: false, login: "", scopes: "", connectedAt: null });
      toast.info("GitHub bağlantısı kaldırıldı");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      toast.error("Kaldırılamadı", e.response?.data?.message ?? "");
    }
  };

  const analyze = async () => {
    setBusy(true);
    setError(null);
    setData(null);
    try {
      const r = await githubAnalyzeApi.analyze(input.trim());
      setData(r);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(
        e.response?.data?.message ??
          "Analiz başarısız — kullanıcı adı doğru mu? Reponun public olduğundan emin ol."
      );
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) analyze();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Github size={12} /> GITHUB ANALİZİ
          </div>
          <h1 className="page-head__title">
            Canlı <span className="ai-text">skill timeline</span>
          </h1>
          <p className="page-head__sub mt-1.5">
            Bir GitHub kullanıcı adı yapıştır — repo dilleri, framework
            manifest&apos;leri (package.json, requirements.txt, pom.xml…) ve
            commit zamanlamasından gerçek beceri profilini çıkartalım.
          </p>
        </div>
      </div>

      {/* GitHub Connect — opt-in for private repos */}
      <div
        className={`mb-3 rounded-[var(--radius-lg)] border p-4 ${
          connect?.connected
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-ai-2/30 bg-ai-2/5"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${
                connect?.connected ? "bg-emerald-500/15 text-emerald-400" : "ai-grad text-white"
              }`}
            >
              {connect?.connected ? <Check size={16} /> : <Lock size={16} />}
            </span>
            <div className="min-w-0">
              {connect?.connected ? (
                <>
                  <div className="text-[13.5px] font-medium">
                    GitHub bağlı: <span className="font-mono">@{connect.login}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-text-2">
                    Kendi handle&apos;ını analiz ettiğinde private repolar da
                    sonuca dahil edilir.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[13.5px] font-medium">
                    Private repolarını da göstermek ister misin?
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-text-2">
                    GitHub&apos;ı bağlayınca kendi handle&apos;ını analiz
                    ettiğinde private projelerin de skill profiline katılır.
                    Diğer kullanıcılara erişmez.
                  </div>
                </>
              )}
            </div>
          </div>
          {connect?.connected ? (
            <button
              type="button"
              onClick={disconnect}
              className="btn btn--outline btn--sm"
            >
              <Unplug size={12} /> Bağlantıyı kaldır
            </button>
          ) : (
            <Button
              onClick={startConnect}
              loading={connecting}
              variant="ai"
              size="sm"
            >
              <Plug size={13} /> GitHub&apos;ı bağla
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 mb-5">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Github
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="kullanıcı adı veya github.com/... URL'i"
                className="w-full rounded-md border border-border bg-surface-2 pl-9 pr-3 py-2.5 text-sm focus:border-text focus:outline-none"
              />
            </div>
          </div>
          <Button onClick={analyze} loading={busy} disabled={!input.trim()} variant="ai">
            <Search size={14} /> Analiz et
          </Button>
        </div>
        {error && (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-sm text-red-300">
            {error}
          </div>
        )}
        {busy && (
          <div className="mt-3 flex items-center gap-2 text-[12.5px] text-text-2">
            <Sparkles size={13} className="text-ai-2 animate-pulse" />
            Repo&apos;lar taranıyor — manifest dosyaları çekiliyor. Bu birkaç saniye sürebilir.
          </div>
        )}
      </div>

      {data && <Result data={data} />}
    </>
  );
}

function Result({ data }: { data: GithubAnalyzeResponse }) {
  const accountAge = useMemo(() => {
    if (!data.accountCreatedAt) return null;
    const years = (Date.now() - new Date(data.accountCreatedAt).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000);
    return years < 1 ? `${Math.round(years * 12)} ay` : `${years.toFixed(1)} yıl`;
  }, [data.accountCreatedAt]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card--grad-border">
        <div className="card__inner flex flex-wrap items-center gap-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl ai-grad text-white">
            <Github size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              GITHUB KULLANICISI
            </div>
            <h2 className="mt-0.5 text-[24px] font-semibold tracking-[-0.025em]">
              @{data.username}
            </h2>
            <div className="mt-1.5 flex flex-wrap gap-2 font-mono text-[11.5px] text-text-2">
              <span className="pill">
                <Star size={11} /> {data.totalStars} yıldız
              </span>
              <span className="pill">
                <Calendar size={11} /> {data.totalPublicRepos} public repo
              </span>
              {data.privateReposIncluded && data.privateReposIncluded > 0 ? (
                <span className="pill" style={{ background: "rgba(99,102,241,0.18)" }}>
                  <Lock size={11} /> +{data.privateReposIncluded} private
                </span>
              ) : null}
              {accountAge && (
                <span className="pill">
                  <Clock size={11} /> {accountAge} GitHub&apos;da
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skill timeline */}
      <SkillTimeline data={data} />

      {/* Skill cards */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          <TrendingUp size={12} /> BECERİ DAĞILIMI ({data.skills.length})
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {data.skills.slice(0, 24).map((s) => (
            <div
              key={s.skill}
              className="rounded-md border border-border bg-surface-2 p-3 text-[12.5px]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-text">{s.skill}</span>
                <span className="font-mono text-[11px] text-text-muted">
                  {s.repoCount} repo
                </span>
              </div>
              {s.firstSeen && (
                <div className="mt-1 font-mono text-[10.5px] text-text-muted">
                  {s.firstSeen} → {s.lastSeen}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Repos */}
      <div>
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          ANALİZ EDİLEN REPO&apos;LAR ({data.repos.length})
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.repos.map((r) => (
            <RepoCard key={r.name} repo={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RepoCard({ repo }: { repo: RepoSummary }) {
  const pushed = repo.pushedAt
    ? new Date(repo.pushedAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
  return (
    <a
      href={repo.htmlUrl}
      target="_blank"
      rel="noreferrer"
      className="block rounded-[var(--radius-md)] border border-border bg-surface p-4 transition hover:border-text"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {repo.private && (
              <Lock size={11} className="text-ai-2" />
            )}
            <h3 className="truncate text-[14px] font-medium">{repo.name}</h3>
            <ExternalLink size={11} className="text-text-muted" />
          </div>
          {repo.description && (
            <p className="mt-1 line-clamp-2 text-[12.5px] text-text-2">
              {repo.description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px] text-text-muted">
        {repo.primaryLanguage && (
          <span className="pill" style={{ fontSize: 10.5 }}>
            {repo.primaryLanguage}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Star size={10} /> {repo.stars}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork size={10} /> {repo.forks}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={10} /> {pushed}
        </span>
      </div>
      {repo.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {repo.skills.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-sm bg-ai-2/10 px-1.5 py-0.5 font-mono text-[10px] text-ai-2"
            >
              {s}
            </span>
          ))}
          {repo.skills.length > 6 && (
            <span className="font-mono text-[10px] text-text-muted">
              +{repo.skills.length - 6}
            </span>
          )}
        </div>
      )}
    </a>
  );
}

function SkillTimeline({ data }: { data: GithubAnalyzeResponse }) {
  // Aggregate timeline → year × topSkills(5) bar chart data
  const { years, perYear } = useMemo(() => {
    const yearSet = new Set<number>();
    const byYearSkill: Record<number, Record<string, number>> = {};
    for (const pt of data.timeline) {
      yearSet.add(pt.year);
      if (!byYearSkill[pt.year]) byYearSkill[pt.year] = {};
      byYearSkill[pt.year][pt.skill] = (byYearSkill[pt.year][pt.skill] || 0) + pt.repoCount;
    }
    const sortedYears = Array.from(yearSet).sort();
    return { years: sortedYears, perYear: byYearSkill };
  }, [data.timeline]);

  const topSkills = useMemo(() => {
    return data.skills.slice(0, 6).map((s) => s.skill);
  }, [data.skills]);

  const skillColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#8b5cf6"];

  if (years.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <p className="text-sm text-text-2">
          Bu kullanıcının repo&apos;ları zaman damgası taşımıyor — timeline
          çizemedik.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(
    1,
    ...years.map((y) =>
      topSkills.reduce((sum, s) => sum + (perYear[y]?.[s] || 0), 0)
    )
  );

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        <TrendingUp size={12} /> SKILL TIMELINE (top {topSkills.length})
      </div>

      <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: 220 }}>
        {years.map((year) => {
          const stacks = topSkills.map((s, i) => ({
            skill: s,
            count: perYear[year]?.[s] || 0,
            color: skillColors[i % skillColors.length],
          }));
          const totalForYear = stacks.reduce((sum, st) => sum + st.count, 0);
          const heightRatio = totalForYear / maxCount;
          return (
            <div key={year} className="flex flex-col items-center min-w-[44px]">
              <div
                className="flex w-9 flex-col-reverse overflow-hidden rounded-md bg-surface-2"
                style={{ height: `${Math.max(8, heightRatio * 180)}px` }}
              >
                {stacks
                  .filter((st) => st.count > 0)
                  .map((st) => (
                    <div
                      key={st.skill}
                      style={{
                        background: st.color,
                        flex: st.count,
                      }}
                      title={`${st.skill}: ${st.count} repo`}
                    />
                  ))}
              </div>
              <div className="mt-1.5 font-mono text-[10.5px] text-text-muted">
                {year}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 font-mono text-[10.5px]">
        {topSkills.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: skillColors[i % skillColors.length] }}
            />
            <span className="text-text-2">{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
