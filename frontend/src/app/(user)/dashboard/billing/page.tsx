"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, Check, X, Crown, Zap, Wand2, Brain } from "lucide-react";

import { billingApi } from "@/lib/billing-api";
import { toast } from "@/components/ui/Toast";
import type { BillingMeResponse, Usage } from "@/types/billing";

type PlanKey = "FREE" | "PREMIUM" | "ENTERPRISE";

const PLANS: {
  key: PlanKey;
  name: string;
  price: string;
  cycle: string;
  features: Array<{ on: boolean; text: string }>;
  cta: string;
}[] = [
  {
    key: "FREE",
    name: "FREE",
    price: "₺0",
    cycle: "ücretsiz",
    features: [
      { on: true, text: "Aylık 1 AI yetkinlik analizi" },
      { on: true, text: "5 aktif başvuru" },
      { on: true, text: "CV parse + GitHub bağlama" },
      { on: false, text: "PDF rapor indirme" },
      { on: false, text: "Şirketlere Premium rozeti" },
      { on: false, text: "Öncelikli destek" },
    ],
    cta: "Mevcut plan",
  },
  {
    key: "PREMIUM",
    name: "PREMIUM",
    price: "₺199",
    cycle: "/ay",
    features: [
      { on: true, text: "Sınırsız AI yetkinlik analizi" },
      { on: true, text: "Sınırsız aktif başvuru" },
      { on: true, text: "PDF rapor indirme" },
      { on: true, text: "Şirketlere Premium rozeti" },
      { on: true, text: "Mesajlaşmada öncelik" },
      { on: false, text: "Şirket yönetim paneli" },
    ],
    cta: "Premium'a yükselt",
  },
  {
    key: "ENTERPRISE",
    name: "ENTERPRISE",
    price: "₺1.499",
    cycle: "/ay",
    features: [
      { on: true, text: "Sınırsız her şey" },
      { on: true, text: "Şirket yönetim paneli" },
      { on: true, text: "Toplu aday analizi" },
      { on: true, text: "API erişimi" },
      { on: true, text: "Özel hesap yöneticisi" },
      { on: true, text: "SLA + öncelikli destek" },
    ],
    cta: "Bizimle görüş",
  },
];

export default function BillingPage() {
  const [data, setData] = useState<BillingMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanKey | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    billingApi
      .me()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: PlanKey) => {
    setError(null);
    setSuccess(null);
    setUpgrading(plan);
    try {
      // Downgrade / cancel → no payment, just flip directly.
      if (plan === "FREE") {
        const next = await billingApi.upgrade(plan);
        setData(next);
        toast.success("Plan değiştirildi", "Artık FREE planındasın.");
        return;
      }
      // Premium / Enterprise → Iyzico hosted checkout.
      const init = await billingApi.checkout(plan);
      const stub = init.stubMode === "true";
      toast.ai(
        stub ? "🧪 Demo ödeme akışı" : "💳 Ödeme sayfasına yönlendiriliyorsun",
        stub
          ? "Iyzico API key tanımlı değil — gerçek kart istenmeden demo amaçlı plan aktifleştirilecek."
          : `Tutar: ${init.priceTry} TL · Iyzico'da kartını gir.`
      );
      // Iyzico's hosted page handles the rest; callback brings the user
      // back to /dashboard/billing?upgraded=1 (or ?payment=failed).
      window.location.href = init.paymentPageUrl;
    } catch (e) {
      toast.error("Plan güncellenemedi", "Lütfen tekrar dene veya admin'le iletişime geç.");
      setError("Plan güncellenemedi.");
      setUpgrading(null);
    }
  };

  // React to query params from the Iyzico callback redirect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("upgraded") === "1") {
      const plan = url.searchParams.get("plan") ?? "PREMIUM";
      toast.ai(`⭐ ${plan} aktif`, "Ödemen alındı, planın yükseltildi.");
      // Refresh billing state so the UI flips immediately.
      billingApi.me().then(setData).catch(() => {});
      // Clean the URL so a refresh doesn't re-toast.
      url.searchParams.delete("upgraded");
      url.searchParams.delete("plan");
      window.history.replaceState({}, "", url.pathname + (url.search || ""));
    } else if (url.searchParams.get("payment") === "failed") {
      const reason = url.searchParams.get("reason") ?? "";
      toast.error(
        "Ödeme tamamlanamadı",
        reason ? "Sebep: " + reason : "Lütfen tekrar dene."
      );
      url.searchParams.delete("payment");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.pathname + (url.search || ""));
    }
  }, []);

  if (loading) return <p className="text-sm text-text-muted">Yükleniyor...</p>;
  if (!data) return null;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Crown size={12} /> ABONELİK
          </div>
          <h1 className="page-head__title">
            <span className="ai-text">Plan</span> ve kullanımın
          </h1>
          <p className="page-head__sub mt-1.5">
            Mevcut planın, bu aydaki sınırların ve PREMIUM avantajları.
          </p>
        </div>
      </div>

      {/* Current plan hero */}
      <div className="hello-grid mb-8">
        <div className="hello-card">
          <div className="page-head__crumbs mb-3">MEVCUT PLAN</div>
          <div className="flex items-center gap-3">
            <h2 className="text-[40px] font-semibold leading-none tracking-[-0.04em]">
              {data.plan}
            </h2>
            {data.isPremium && (
              <span className="pill pill--ai" style={{ fontSize: 11 }}>
                <Sparkles size={11} /> AKTİF
              </span>
            )}
          </div>
          <p className="page-head__sub mt-3 max-w-md">
            {data.isPremium
              ? "PREMIUM erişimin var — sınırsız analiz, PDF indirme ve şirketlere görünen Premium rozet."
              : "FREE planındasın. Sınırlarını yükseltmek için PREMIUM'a geçebilirsin."}
          </p>
        </div>

        {/* Usage panel */}
        <div className="score-widget">
          <div className="score-widget__inner">
            <div className="mb-4 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
              <Zap size={12} className="text-ai-2" /> BU AYIN KULLANIMI
            </div>
            <div className="flex flex-col gap-4">
              <UsageBar
                label="AI yetkinlik analizi"
                usage={data.aiAnalysisLast30d}
                ai
              />
              <UsageBar label="Aktif başvuru" usage={data.activeApplications} />
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Plan compare grid */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-medium">Plan karşılaştırma</h3>
      </div>
      <div className="plan-grid mb-8 mt-6">
        {PLANS.map((p) => {
          const featured = p.key === "PREMIUM";
          const isCurrent = data.plan === p.key;
          const inner = (
            <>
              {featured && (
                <span className="plan-card__badge">Tavsiye edilen</span>
              )}
              <span className="plan-card__name">{p.name}</span>
              <div className="plan-card__price">
                <span className="plan-card__price-num">{p.price}</span>
                <span className="plan-card__price-cycle">{p.cycle}</span>
              </div>
              <ul className="mt-6 mb-7 flex flex-col">
                {p.features.map((f) => (
                  <li
                    key={f.text}
                    className={`plan-feature ${f.on ? "" : "plan-feature--off"}`}
                  >
                    {f.on ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <X size={14} className="text-text-muted" />
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {isCurrent ? (
                  <button
                    disabled
                    className="btn btn--outline w-full disabled:opacity-60"
                  >
                    Aktif planın
                  </button>
                ) : p.key === "ENTERPRISE" ? (
                  <a
                    href="mailto:sales@synapse.local"
                    className="btn btn--outline w-full"
                  >
                    {p.cta}
                  </a>
                ) : featured ? (
                  <button
                    onClick={() => handleUpgrade(p.key)}
                    disabled={upgrading !== null}
                    className="btn btn--ai w-full"
                  >
                    {upgrading === p.key ? (
                      "Yükseltiliyor..."
                    ) : (
                      <>
                        <Sparkles size={14} /> {p.cta}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(p.key)}
                    disabled={upgrading !== null}
                    className="btn btn--outline w-full"
                  >
                    {upgrading === p.key ? "Geçiliyor..." : p.cta}
                  </button>
                )}
              </div>
            </>
          );
          return featured ? (
            <div key={p.key} className="plan-card plan-card--featured">
              <div className="plan-card__inner">{inner}</div>
            </div>
          ) : (
            <div key={p.key} className="plan-card">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Premium feature tiles */}
      <div className="mb-2">
        <h3 className="text-[13px] font-medium">PREMIUM ile gelen özellikler</h3>
      </div>
      <div className="qa-grid mb-8">
        <PremiumTile
          icon={<Sparkles size={18} />}
          title="Sınırsız AI analizi"
          desc="İstediğin kadar yeniden çalıştır, her güncellemede skorunu izle."
        />
        <PremiumTile
          icon={<Wand2 size={18} />}
          title="PDF rapor indir"
          desc="Mülakatlarda paylaşılabilir profesyonel PDF rapor."
        />
        <PremiumTile
          icon={<Brain size={18} />}
          title="Akıllı eşleşme"
          desc="Şirket aramalarında üst sıralarda görün, premium rozetiyle öne çık."
        />
      </div>

      <p className="font-mono text-[11px] text-text-muted">
        ⚠️ Demo modu — gerçek ödeme alınmaz. Production&apos;da Iyzico checkout
        akışı ile değiştirilecek.{" "}
        <Link href="/dashboard/analysis" className="text-text border-b border-border-strong">
          Analize geri dön
        </Link>
      </p>
    </>
  );
}

function UsageBar({
  label,
  usage,
  ai,
}: {
  label: string;
  usage: Usage;
  ai?: boolean;
}) {
  const unlimited = usage.limit < 0;
  const pct = unlimited ? 100 : Math.min(100, (usage.current / usage.limit) * 100);
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setAnimated(pct), 300);
    return () => clearTimeout(id);
  }, [pct]);

  const fillClass = unlimited
    ? "usage__fill--ai"
    : ai
      ? "usage__fill--ai"
      : pct >= 85
        ? "usage__fill--danger"
        : pct >= 60
          ? "usage__fill--warn"
          : "";

  return (
    <div className="usage">
      <div className="usage__head">
        <span className="usage__title">{label}</span>
        <span className="usage__count">
          {unlimited
            ? `${usage.current} · ∞`
            : `${usage.current} / ${usage.limit}`}
        </span>
      </div>
      <div className="usage__track">
        <div
          className={`usage__fill ${fillClass}`}
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  );
}

function PremiumTile({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="qa qa--ai cursor-default">
      <div className="qa__icon">{icon}</div>
      <div className="qa__title">{title}</div>
      <div className="qa__sub">{desc}</div>
    </div>
  );
}
