"use client";

import { useRequireRole } from "@/lib/use-require-role";
import { Nav } from "@/components/Nav";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("COMPANY");

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
        title="Şirket Paneli"
        links={[
          { href: "/company", label: "Ana Sayfa" },
          { href: "/company/jobs", label: "İlanlarım" },
          { href: "/company/messages", label: "Mesajlar" },
          { href: "/company/profile", label: "Şirket Profili" },
        ]}
      />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
