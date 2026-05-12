"use client";

import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  Brain,
  MessageSquare,
  Building2,
  Crown,
} from "lucide-react";

import { useRequireRole } from "@/lib/use-require-role";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("COMPANY");

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-text-muted">
        Yükleniyor...
      </div>
    );
  }

  return (
    <DashboardShell
      role="COMPANY"
      workspaceLabel="Yönetim"
      primaryItems={[
        { href: "/company", label: "Panel", icon: LayoutDashboard },
        { href: "/company/jobs", label: "İlanlarım", icon: Briefcase },
        { href: "/company/messages", label: "Mesajlar", icon: MessageSquare },
      ]}
      accountItems={[
        { href: "/company/profile", label: "Şirket Profili", icon: Building2 },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
