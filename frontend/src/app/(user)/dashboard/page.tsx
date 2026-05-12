"use client";

import Link from "next/link";
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
        <Card
          href="/dashboard/cv"
          title="📄 CV'm"
          desc="CV yükle, ayrıştır, düzenle"
        />
        <Card
          href="/dashboard/analysis"
          title="🤖 AI Yetkinlik Analizi"
          desc="GitHub verilerinle skill'lerini doğrula"
        />
        <Card
          href="/dashboard/jobs"
          title="💼 İş İlanları"
          desc="Sana uygun pozisyonları keşfet"
        />
        <Card
          href="/dashboard/applications"
          title="📋 Başvurularım"
          desc="Gönderdiğin başvuruları takip et"
        />
        <Card
          href="/dashboard/profile"
          title="👤 Profil"
          desc="GitHub URL'in ve diğer bilgilerin"
        />
      </div>
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </Link>
  );
}
