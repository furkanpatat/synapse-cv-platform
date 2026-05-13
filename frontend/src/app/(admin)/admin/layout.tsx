"use client";

import { LayoutDashboard, Users, Building2, BarChart3 } from "lucide-react";

import { useRequireRole } from "@/lib/use-require-role";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("ADMIN");

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-text-muted">
        Yükleniyor...
      </div>
    );
  }

  return (
    <DashboardShell
      role="ADMIN"
      workspaceLabel="Sistem"
      primaryItems={[
        { href: "/admin", label: "Panel", icon: LayoutDashboard },
        { href: "/admin/analytics", label: "Analitik", icon: BarChart3 },
        { href: "/admin/users", label: "Kullanıcılar", icon: Users },
        { href: "/admin/companies", label: "Şirketler", icon: Building2 },
      ]}
      accountItems={[]}
    >
      {children}
    </DashboardShell>
  );
}
