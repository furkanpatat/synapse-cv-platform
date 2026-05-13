"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Network, Sparkles, RefreshCw, Info } from "lucide-react";

import { skillsApi, type SkillGraphResponse } from "@/lib/skills-api";
import { SkillForceGraph } from "@/components/skills/SkillForceGraph";
import type { ApiError } from "@/types/auth";

export default function SkillsGraphPage() {
  const [data, setData] = useState<SkillGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.45);

  const fetchGraph = (t: number) => {
    setLoading(true);
    setError(null);
    skillsApi
      .graph({ threshold: t, maxEdges: 4, marketTop: 25 })
      .then(setData)
      .catch((err: AxiosError<ApiError>) =>
        setError(err.response?.data?.message ?? "Graf yüklenemedi")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGraph(threshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clusters = useMemo(() => {
    if (!data) return 0;
    const set = new Set<number>();
    for (const n of data.nodes) set.add(n.cluster);
    return set.size;
  }, [data]);

  const ownedCount = useMemo(
    () => data?.nodes.filter((n) => n.owned).length ?? 0,
    [data]
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Network size={12} /> SKILL GRAFI
          </div>
          <h1 className="page-head__title">
            <span className="ai-text">{ownedCount}</span>/{data?.nodes.length ?? 0}{" "}
            beceri haritada
          </h1>
          <p className="page-head__sub mt-1.5">
            Senin yetkinliklerin + iş ilanlarında en çok aranan beceriler tek
            grafda. Çizgiler semantik yakınlık (sentence-transformers cosine);
            renkler kümeler. Dolu daireler = sende var, içi boş daireler = piyasa
            istiyor ama sende yok.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchGraph(threshold)}
          className="btn btn--outline btn--sm"
        >
          <RefreshCw size={12} /> Yenile
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          Benzerlik eşiği
        </span>
        <input
          type="range"
          min={0.25}
          max={0.75}
          step={0.05}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          onMouseUp={() => fetchGraph(threshold)}
          onTouchEnd={() => fetchGraph(threshold)}
          className="flex-1 max-w-[280px]"
        />
        <span className="font-mono text-[12px] text-text">{threshold.toFixed(2)}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
          <Info size={11} /> {clusters} küme · {data?.edges.length ?? 0} bağ
        </span>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-12 text-center">
          <Sparkles size={20} className="mx-auto mb-2 text-ai-2 animate-pulse" />
          <p className="text-sm text-text-2">
            Embeddings hesaplanıyor — sentence-transformers ilk açılışta biraz
            yavaş olabilir.
          </p>
        </div>
      ) : !data || data.nodes.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong p-12 text-center">
          <Network size={28} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-2">
            Henüz graf çizmek için yeterli veri yok. CV&apos;ni yükle ya da iş
            ilanlarına bak — kümeler ona göre oluşur.
          </p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <SkillForceGraph nodes={data.nodes} edges={data.edges} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-text-2">
        <Legend swatch="#6366f1" filled label="Sende olan beceri" />
        <Legend swatch="#6366f1" filled={false} label="Piyasa istiyor, sende yok" />
        <Legend label={`Daire büyüklüğü = aranma sayısı`} />
        <Legend label="Çizgi kalınlığı = semantik yakınlık" />
      </div>
    </>
  );
}

function Legend({
  swatch,
  filled,
  label,
}: {
  swatch?: string;
  filled?: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch !== undefined && (
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{
            background: filled ? swatch : "transparent",
            border: filled ? "none" : `2px solid ${swatch}`,
          }}
        />
      )}
      {label}
    </span>
  );
}
