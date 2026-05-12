"use client";

import { useEffect, useState } from "react";

import { billingApi } from "@/lib/billing-api";
import type { BillingMeResponse, Usage } from "@/types/billing";

export default function BillingPage() {
  const [data, setData] = useState<BillingMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billingApi
      .me()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  if (!data) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Abonelik & Kullanım</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mevcut planın ve bu aydaki kullanımın.
        </p>
      </header>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">Mevcut Plan</p>
            <p className="mt-1 text-3xl font-bold">
              {data.plan}{" "}
              {data.isPremium && (
                <span className="ml-2 rounded-full bg-yellow-200 px-2 py-0.5 text-xs text-yellow-900">
                  ⭐ Premium
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <UsageBar
            label="AI Yetkinlik Analizi (son 30 gün)"
            usage={data.aiAnalysisLast30d}
          />
          <UsageBar label="Aktif Başvuru" usage={data.activeApplications} />
        </div>
      </div>

      <PlanCompareTable plan={data.plan} />

      {!data.isPremium && (
        <div className="rounded-lg border border-brand/30 bg-brand/5 p-6">
          <h3 className="mb-2 text-lg font-semibold">⭐ PREMIUM'a Yükselt</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Sınırsız AI analizi, sınırsız başvuru, PDF rapor indirme ve şirketlere
            görünen Premium rozeti.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Ödeme entegrasyonu Faz 9'da Iyzico ile aktif olacak. Şu an admin
            üzerinden manuel yükseltme yapılır.
          </p>
        </div>
      )}
    </div>
  );
}

function UsageBar({ label, usage }: { label: string; usage: Usage }) {
  const unlimited = usage.limit < 0;
  const pct = unlimited ? 0 : Math.min(100, (usage.current / usage.limit) * 100);
  const exceeded = !unlimited && usage.current >= usage.limit;
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-gray-500">
        {unlimited
          ? `${usage.current} kullanıldı · Sınırsız`
          : `${usage.current} / ${usage.limit}`}
      </p>
      {!unlimited && (
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className={exceeded ? "h-full bg-red-500" : "h-full bg-brand"}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PlanCompareTable({ plan }: { plan: string }) {
  const rows = [
    { feature: "AI Yetkinlik Analizi", free: "Ayda 1", premium: "Sınırsız" },
    { feature: "Aktif başvuru", free: "5", premium: "Sınırsız" },
    { feature: "PDF rapor indirme", free: "—", premium: "✓" },
    { feature: "Premium rozet (şirkete görünür)", free: "—", premium: "✓" },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-2 text-left">Özellik</th>
            <th className={`px-4 py-2 text-left ${plan === "FREE" ? "font-bold text-brand" : ""}`}>
              FREE {plan === "FREE" && "(senin planın)"}
            </th>
            <th className={`px-4 py-2 text-left ${plan !== "FREE" ? "font-bold text-brand" : ""}`}>
              PREMIUM {plan !== "FREE" && "(senin planın)"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.feature} className="border-t border-gray-100 dark:border-gray-800">
              <td className="px-4 py-2 font-medium">{r.feature}</td>
              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{r.free}</td>
              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{r.premium}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
