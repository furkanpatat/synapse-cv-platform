"use client";

import {
  LayoutDashboard,
  FileText,
  Brain,
  Briefcase,
  Inbox,
  MessageSquare,
  User,
  Crown,
  Bookmark,
  Video,
  Activity,
  Network,
} from "lucide-react";

import { useRequireRole } from "@/lib/use-require-role";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("USER");

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-text-muted">
        Yükleniyor...
      </div>
    );
  }

  return (
    <DashboardShell
      role="USER"
      workspaceLabel="Çalışma alanı"
      primaryItems={[
        { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
        { href: "/dashboard/cv", label: "CV'm", icon: FileText },
        { href: "/dashboard/analysis", label: "AI Analiz", icon: Brain, badge: "AI" },
        { href: "/dashboard/skills", label: "Skill Grafı", icon: Network, badge: "AI" },
        { href: "/dashboard/jobs", label: "İlanlar", icon: Briefcase },
        { href: "/dashboard/saved", label: "Kayıtlılar", icon: Bookmark },
        { href: "/dashboard/applications", label: "Başvurularım", icon: Inbox },
        { href: "/dashboard/interviews", label: "Mülakatlarım", icon: Video, badge: "AI" },
        { href: "/dashboard/messages", label: "Mesajlar", icon: MessageSquare },
      ]}
      accountItems={[
        { href: "/dashboard/profile", label: "Profil", icon: User },
        { href: "/dashboard/activity", label: "Aktivite", icon: Activity },
        { href: "/dashboard/billing", label: "Abonelik", icon: Crown },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
