"use client";

import { useRequireRole } from "@/lib/use-require-role";
import { Nav } from "@/components/Nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("ADMIN");

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav
        title="Admin Paneli"
        links={[
          { href: "/admin", label: "Ana Sayfa" },
          { href: "/admin/users", label: "Kullanıcılar" },
          { href: "/admin/companies", label: "Şirketler" },
          { href: "/admin/logs", label: "Loglar" },
        ]}
      />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
