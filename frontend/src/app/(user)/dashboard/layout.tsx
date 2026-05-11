"use client";

import { useRequireRole } from "@/lib/use-require-role";
import { Nav } from "@/components/Nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("USER");

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
        title="Kullanıcı Paneli"
        links={[
          { href: "/dashboard", label: "Ana Sayfa" },
          { href: "/dashboard/cv", label: "CV" },
          { href: "/dashboard/jobs", label: "İlanlar" },
          { href: "/dashboard/applications", label: "Başvurularım" },
          { href: "/dashboard/messages", label: "Mesajlar" },
        ]}
      />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
