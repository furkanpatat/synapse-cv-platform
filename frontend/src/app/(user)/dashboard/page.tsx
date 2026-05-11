"use client";

import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Merhaba, {user?.firstName}!</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          CV Platform kullanıcı paneline hoş geldin.
        </p>
      </div>

      {!user?.emailVerified && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          ⚠️ E-posta adresin henüz doğrulanmadı. Posta kutunu kontrol et.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="CV'm" desc="Henüz yüklenmedi — Faz 3'te aktif olacak" />
        <Card title="Başvurularım" desc="0 aktif başvuru" />
        <Card title="AI Yetkinlik Skoru" desc="GitHub bağlamak için bekliyor" />
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
