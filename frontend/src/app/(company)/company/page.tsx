"use client";

import { useAuthStore } from "@/lib/auth-store";

export default function CompanyHomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Şirket Paneli</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Hoş geldin {user?.firstName}. Buradan ilanlarını ve başvuruları yönetebilirsin.
        </p>
      </div>

      <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
        ⚠️ Şirket hesabın admin onayını bekliyor. Onay alınana kadar ilan açamazsın.
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Aktif İlanlar" desc="0 ilan — Faz 5'te aktif" />
        <Card title="Bekleyen Başvurular" desc="0 başvuru" />
        <Card title="Mülakat Aşaması" desc="0 aday" />
      </div>
    </div>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}
