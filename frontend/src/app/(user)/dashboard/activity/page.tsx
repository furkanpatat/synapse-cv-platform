"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Activity,
  LogIn,
  Briefcase,
  Inbox,
  Video,
  Crown,
  UserPlus,
  CircleDot,
} from "lucide-react";

import { auditApi } from "@/lib/audit-api";
import type { ApiError } from "@/types/auth";
import type { AuditLogEntry } from "@/types/audit";

export default function UserActivityPage() {
  const [list, setList] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auditApi
      .mine()
      .then(setList)
      .catch((err: AxiosError<ApiError>) =>
        setError(err.response?.data?.message ?? "Aktivite alınamadı")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <Activity size={12} /> AKTİVİTE GEÇMİŞİ
          </div>
          <h1 className="page-head__title">
            Son <span className="ai-text">{list.length}</span> hareket
          </h1>
          <p className="page-head__sub mt-1.5">
            Hesabında yapılan tüm önemli olaylar — giriş, başvuru, mülakat,
            plan değişikliği. Şüpheli bir aktivite görürsen şifreni hemen
            değiştir.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Yükleniyor...</p>
      ) : list.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong p-12 text-center">
          <Activity size={28} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-2">
            Henüz kayıtlı bir aktivite yok. İlk başvuruyu yaptığında burada
            görünecek.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-6">
          {list.map((e) => (
            <Item key={e.id} entry={e} />
          ))}
        </ol>
      )}
    </>
  );
}

function Item({ entry }: { entry: AuditLogEntry }) {
  const ts = new Date(entry.createdAt);
  const Icon = iconFor(entry.eventType);
  const tone = toneFor(entry.eventType);
  return (
    <li className="relative">
      <span
        className={`absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full border border-border bg-surface ${tone}`}
        aria-hidden
      >
        <Icon size={11} />
      </span>
      <div className="rounded-[var(--radius-md)] border border-border bg-surface p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-medium tracking-[-0.01em]">
            {humanLabel(entry.eventType)}
          </span>
          <span className="pill" style={{ fontSize: 10.5 }}>
            {entry.eventType}
          </span>
        </div>
        {entry.summary && (
          <p className="mt-1 text-[13px] text-text-2">{entry.summary}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[11px] text-text-muted">
          <span>
            {ts.toLocaleString("tr-TR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
        </div>
      </div>
    </li>
  );
}

function iconFor(eventType: string) {
  if (eventType.startsWith("auth.login")) return LogIn;
  if (eventType === "auth.register") return UserPlus;
  if (eventType.startsWith("job.")) return Briefcase;
  if (eventType.startsWith("application.")) return Inbox;
  if (eventType.startsWith("interview.")) return Video;
  if (eventType.startsWith("billing.")) return Crown;
  return CircleDot;
}

function toneFor(eventType: string): string {
  if (eventType.endsWith("failed")) return "text-red-400";
  if (eventType.startsWith("interview.")) return "text-violet-400";
  if (eventType.startsWith("billing.")) return "text-amber-400";
  if (eventType.startsWith("application.")) return "text-emerald-400";
  if (eventType.startsWith("auth.login.success")) return "text-emerald-400";
  return "text-text-muted";
}

function humanLabel(eventType: string): string {
  const map: Record<string, string> = {
    "auth.login.success": "Giriş yaptın",
    "auth.login.failed": "Başarısız giriş denemesi",
    "auth.register": "Hesap oluşturdun",
    "job.created": "İlan oluşturdun",
    "job.updated": "İlan güncelledin",
    "job.deleted": "İlan sildin",
    "application.submitted": "Başvuru yaptın",
    "application.status.changed": "Başvuru durumunu değiştirdin",
    "interview.scheduled": "Mülakat planladın",
    "interview.started": "Mülakat başlattın",
    "interview.ended": "Mülakat bitti",
    "billing.upgraded": "Plan değiştirdin",
  };
  return map[eventType] ?? eventType;
}
