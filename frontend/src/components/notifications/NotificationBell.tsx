"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Inbox,
  MessageSquare,
  Sparkles,
  Check,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { notificationsApi } from "@/lib/notifications-api";
import { useAuthStore } from "@/lib/auth-store";
import { getMessagingSocket } from "@/lib/ws-client";
import { toast } from "@/components/ui/Toast";
import type { NotificationDto, NotificationType } from "@/types/notification";

const ICONS: Record<NotificationType, LucideIcon> = {
  APPLICATION_STATUS: Inbox,
  NEW_APPLICATION: Inbox,
  NEW_MESSAGE: MessageSquare,
  ANALYSIS_COMPLETE: Sparkles,
  COMPANY_VERIFIED: Building2,
  SYSTEM: Bell,
};

export function NotificationBell() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // initial load
  useEffect(() => {
    if (!accessToken) return;
    notificationsApi
      .list(0, 15)
      .then((feed) => {
        setItems(feed.items);
        setUnread(feed.unread);
      })
      .catch(() => {});
  }, [accessToken]);

  // WS subscribe
  useEffect(() => {
    if (!accessToken) return;
    const socket = getMessagingSocket();
    socket.connect(accessToken);
    const unsub = socket.onNotification((n) => {
      setItems((prev) => [n, ...prev].slice(0, 30));
      setUnread((u) => u + 1);
      // Surface as a transient toast too
      const tone: "ai" | "success" | "info" =
        n.type === "ANALYSIS_COMPLETE"
          ? "ai"
          : n.type === "APPLICATION_STATUS"
            ? "success"
            : "info";
      toast[tone](n.title, n.body ?? undefined);
    });
    return unsub;
  }, [accessToken]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const handleItemClick = async (n: NotificationDto) => {
    if (!n.readAt) {
      try {
        await notificationsApi.markRead(n.id);
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x
          )
        );
        setUnread((u) => Math.max(0, u - 1));
      } catch {}
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? now })));
      setUnread(0);
    } catch {}
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="icon-btn relative"
        aria-label="Bildirimler"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, hsl(280 88% 60%), hsl(218 92% 55%), hsl(190 85% 50%))",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[360px] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)] z-50"
          style={{ maxHeight: "70vh" }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <Bell size={14} className="text-text-muted" /> Bildirimler
              {unread > 0 && (
                <span className="pill pill--ai" style={{ fontSize: 10 }}>
                  {unread} yeni
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[11.5px] text-text-2 hover:text-text"
              >
                Hepsini okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-text-muted">
                Henüz bildirim yok.
              </div>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                const content = (
                  <div
                    onClick={() => handleItemClick(n)}
                    className={`flex cursor-pointer items-start gap-3 border-b border-border px-4 py-3 transition hover:bg-surface-2 ${
                      n.readAt ? "" : "bg-ai-2/5"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        n.readAt
                          ? "bg-surface-2 text-text-2"
                          : "ai-grad text-white"
                      }`}
                    >
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="truncate text-[13px] font-medium leading-snug">
                          {n.title}
                        </p>
                        {!n.readAt && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ai-2" />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-text-2 leading-snug">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-text-muted">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>

          {items.length > 0 && unread === 0 && (
            <div className="border-t border-border px-4 py-2 text-center font-mono text-[10.5px] uppercase tracking-wider text-text-muted">
              <Check size={10} className="inline" /> Hepsi okundu
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.round(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.round(diff / 3600)} saat önce`;
  return d.toLocaleDateString("tr-TR");
}
