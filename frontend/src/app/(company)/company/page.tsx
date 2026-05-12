"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  const activeCount = jobs.filter((j) => j.status === "ACTIVE").length;
  const draftCount = jobs.filter((j) => j.status === "DRAFT").length;
  const totalApps = jobs.reduce((sum, j) => sum + j.applicationCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Şirket Paneli</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Hoş geldin {user?.firstName}.{" "}
          {company?.name ? `(${company.name})` : ""}
        </p>
      </div>

      {company && !company.verified && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          ⚠️ Şirket hesabın admin onayını bekliyor.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          href="/company/jobs"
          title="📋 İlanlarım"
          value={`${jobs.length} ilan`}
          desc={`${activeCount} aktif · ${draftCount} taslak`}
        />
        <Card
          href="/company/jobs"
          title="📨 Toplam Başvuru"
          value={String(totalApps)}
          desc="İlanlar üzerinden detay göreceksin"
        />
        <Card
          href="/company/profile"
          title="🏢 Şirket Profili"
          value={company?.verified ? "Onaylı" : "Onay bekliyor"}
          desc="Bilgilerini güncelle"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 font-semibold">Hızlı İşlem</h2>
        <Link
          href="/company/jobs/new"
          className="inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Yeni İlan Oluştur
        </Link>
      </div>
    </div>
  );
}

function Card({
  href,
  title,
  value,
  desc,
}: {
  href: string;
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand dark:border-gray-800 dark:bg-gray-900"
    >
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{desc}</p>
    </Link>
  );
}
