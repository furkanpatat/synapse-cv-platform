"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";

import { adminApi } from "@/lib/admin-api";
import type { ApiError } from "@/types/auth";
import type { AdminStats } from "@/types/admin";

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "İstatistikler yüklenemedi");
      });
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin Paneli</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sistem geneli yönetim ve istatistikler.
        </p>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Toplam Kullanıcı" value={stats.totalUsers} />
            <Stat label="Banlı Kullanıcı" value={stats.bannedUsers} accent="red" />
            <Stat label="Şirket" value={stats.totalCompanies} />
            <Stat
              label="Onay Bekleyen"
              value={stats.pendingCompanies}
              accent={stats.pendingCompanies > 0 ? "yellow" : undefined}
            />
            <Stat label="Toplam İlan" value={stats.totalJobs} />
            <Stat label="Aktif İlan" value={stats.activeJobs} accent="green" />
            <Stat label="Toplam Başvuru" value={stats.totalApplications} />
            <Stat label="Onaylı Şirket" value={stats.verifiedCompanies} accent="green" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Action href="/admin/users" label="👥 Kullanıcıları Yönet" />
            <Action
              href="/admin/companies"
              label={`🏢 Şirketleri Yönet${stats.pendingCompanies > 0 ? ` (${stats.pendingCompanies} bekliyor)` : ""}`}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "red" | "green" | "yellow";
}) {
  const color =
    accent === "red"
      ? "text-red-600"
      : accent === "green"
        ? "text-green-600"
        : accent === "yellow"
          ? "text-yellow-600"
          : "";
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Action({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium transition hover:border-brand hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      {label}
    </Link>
  );
}
