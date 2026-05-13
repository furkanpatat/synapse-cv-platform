"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  Sparkles,
  Menu,
  Sun,
  Moon,
  LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { authApi } from "@/lib/auth-api";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SynapseAssistant } from "@/components/ai/SynapseAssistant";
import type { Role } from "@/types/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "AI" | string;
  count?: number;
}

interface Props {
  role: Role;
  workspaceLabel: string;
  primaryItems: NavItem[];
  accountItems: NavItem[];
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  workspaceLabel,
  primaryItems,
  accountItems,
  children,
}: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored =
      (localStorage.getItem("cvp-theme") as "dark" | "light" | null) ?? "dark";
    setTheme(stored);
    document.documentElement.dataset.theme = stored;
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("cvp-theme", next);
  };

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {}
    }
    clear();
    router.replace("/login");
  };

  const initials = ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")) || "U";
  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : (user?.email ?? "Kullanıcı");
  const planLabel =
    role === "COMPANY"
      ? "ENTERPRISE · Şirket"
      : role === "ADMIN"
        ? "ADMIN · Yönetici"
        : "FREE · Bireysel";
  const grad =
    role === "COMPANY"
      ? "linear-gradient(135deg,#6366f1,#06b6d4)"
      : role === "ADMIN"
        ? "linear-gradient(135deg,#ef4444,#f59e0b)"
        : "linear-gradient(135deg,#a855f7,#22d3ee)";

  return (
    <div className="app-shell">
      <Sidebar
        workspaceLabel={workspaceLabel}
        primaryItems={primaryItems}
        accountItems={accountItems}
        theme={theme}
        toggleTheme={toggleTheme}
        displayName={displayName}
        planLabel={planLabel}
        initials={initials.toUpperCase()}
        grad={grad}
        onLogout={handleLogout}
      />
      {/* Desktop top-right floating bell */}
      <div className="fixed right-6 top-5 z-40 hidden lg:block">
        <NotificationBell />
      </div>
      <MobileBar
        theme={theme}
        toggleTheme={toggleTheme}
        initials={initials.toUpperCase()}
        grad={grad}
      />
      <main className="app-main">{children}</main>
      <SynapseAssistant />
    </div>
  );
}

function Sidebar({
  workspaceLabel,
  primaryItems,
  accountItems,
  theme,
  toggleTheme,
  displayName,
  planLabel,
  initials,
  grad,
  onLogout,
}: {
  workspaceLabel: string;
  primaryItems: NavItem[];
  accountItems: NavItem[];
  theme: "dark" | "light";
  toggleTheme: () => void;
  displayName: string;
  planLabel: string;
  initials: string;
  grad: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const renderItem = (it: NavItem) => {
    const active =
      pathname === it.href ||
      (it.href !== "/dashboard" &&
        it.href !== "/company" &&
        it.href !== "/admin" &&
        pathname?.startsWith(it.href));
    const Icon = it.icon;
    return (
      <Link
        key={it.href}
        href={it.href}
        className={`sidebar__item ${active ? "sidebar__item--active" : ""}`}
      >
        <Icon className="sidebar__icon" />
        <span>{it.label}</span>
        {it.badge && (
          <span className="sidebar__badge sidebar__badge--ai">{it.badge}</span>
        )}
        {it.count != null && <span className="sidebar__badge">{it.count}</span>}
      </Link>
    );
  };

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar__brand">
        <span className="sidebar__brand-mark">
          <Sparkles size={14} />
        </span>
        Synapse
      </Link>

      <div className="sidebar__section">{workspaceLabel}</div>
      <nav className="sidebar__nav">{primaryItems.map(renderItem)}</nav>

      <div className="sidebar__section">Hesap</div>
      <nav className="sidebar__nav">{accountItems.map(renderItem)}</nav>

      <div className="sidebar__footer">
        <button
          type="button"
          onClick={toggleTheme}
          className="mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-text-2 hover:bg-surface-2"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          <span className="font-mono">{theme === "dark" ? "Karanlık" : "Aydınlık"}</span>
        </button>
        <button type="button" onClick={onLogout} className="sidebar__user">
          <span className="sidebar__avatar" style={{ background: grad }}>
            {initials}
          </span>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{displayName}</div>
            <div className="sidebar__user-plan">{planLabel}</div>
          </div>
          <ChevronRight className="sidebar__icon" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    </aside>
  );
}

function MobileBar({
  theme,
  toggleTheme,
  initials,
  grad,
}: {
  theme: "dark" | "light";
  toggleTheme: () => void;
  initials: string;
  grad: string;
}) {
  return (
    <div className="mobile-bar">
      <button type="button" className="icon-btn" aria-label="Menü">
        <Menu size={18} />
      </button>
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-6 w-6 place-items-center rounded-md ai-grad">
          <Sparkles size={12} className="text-white" />
        </span>
        Synapse
      </Link>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <button type="button" onClick={toggleTheme} className="icon-btn" aria-label="Tema">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white"
          style={{ background: grad }}
        >
          {initials}
        </span>
      </div>
    </div>
  );
}
