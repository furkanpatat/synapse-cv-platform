"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  ScrollText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

import { auditApi } from "@/lib/audit-api";
import type { ApiError } from "@/types/auth";
import type { AuditLogEntry, AuditPage } from "@/types/audit";

// Curated list — matches AuditEventType.java on the backend.
const EVENT_GROUPS: { label: string; types: string[] }[] = [
  { label: "Tümü", types: [] },
  {
    label: "Auth",
    types: ["auth.login.success", "auth.login.failed", "auth.register"],
  },
  { label: "İlanlar", types: ["job.created", "job.updated", "job.deleted"] },
  {
    label: "Başvurular",
    types: ["application.submitted", "application.status.changed"],
  },
  {
    label: "Mülakatlar",
    types: ["interview.scheduled", "interview.started", "interview.ended"],
  },
  {
    label: "Admin",
    types: [
      "admin.user.banned",
      "admin.user.unbanned",
      "admin.user.plan_changed",
      "admin.company.verified",
    ],
  },
  { label: "Billing", types: ["billing.upgraded"] },
];

const RANGE_OPTIONS = [
  { label: "Son 1 saat", hours: 1 },
  { label: "Son 24 saat", hours: 24 },
  { label: "Son 7 gün", hours: 24 * 7 },
  { label: "Tümü", hours: 0 },
];

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [groupIdx, setGroupIdx] = useState(0);
  const [eventType, setEventType] = useState<string>("");
  const [sinceHours, setSinceHours] = useState<number>(24);
  const [search, setSearch] = useState("");

  const fetchPage = useCallback(() => {
    setLoading(true);
    setError(null);
    auditApi
      .list({
        page,
        size: 50,
        eventType: eventType || undefined,
        sinceHours: sinceHours > 0 ? sinceHours : undefined,
      })
      .then(setData)
      .catch((err: AxiosError<ApiError>) =>
        setError(err.response?.data?.message ?? "Log yüklenemedi")
      )
      .finally(() => setLoading(false));
  }, [page, eventType, sinceHours]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.content;
    const s = search.toLowerCase();
    return data.content.filter((e) => {
      const blob =
        `${e.summary ?? ""} ${e.actorEmail ?? ""} ${e.eventType} ${e.targetId ?? ""}`.toLowerCase();
      return blob.includes(s);
    });
  }, [data, search]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            <ScrollText size={12} /> SİSTEM DENETİM LOGU
          </div>
          <h1 className="page-head__title">
            <span className="ai-text">{data?.totalElements ?? 0}</span> kayıt
          </h1>
          <p className="page-head__sub mt-1.5">
            Kim ne yaptı, ne zaman yaptı — append-only event stream. Filtre
            seçenekleriyle daralt, IP / actor / event üzerinden ara.
          </p>
        </div>
        <button
          onClick={fetchPage}
          className="btn btn--outline btn--sm"
          type="button"
        >
          <RefreshCw size={12} /> Yenile
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          <Filter size={11} /> Filtre
        </div>

        {/* Event group tabs */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {EVENT_GROUPS.map((g, i) => (
            <button
              type="button"
              key={g.label}
              onClick={() => {
                setGroupIdx(i);
                setEventType(g.types.length === 1 ? g.types[0] : "");
                setPage(0);
              }}
              className={`pill ${i === groupIdx ? "pill--ai" : ""}`}
              style={{ fontSize: 11, cursor: "pointer" }}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Within-group event filter (if multiple) */}
        {EVENT_GROUPS[groupIdx].types.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEventType("");
                setPage(0);
              }}
              className={`pill ${eventType === "" ? "pill--ai" : ""}`}
              style={{ fontSize: 10.5, cursor: "pointer" }}
            >
              hepsi
            </button>
            {EVENT_GROUPS[groupIdx].types.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => {
                  setEventType(t);
                  setPage(0);
                }}
                className={`pill ${eventType === t ? "pill--ai" : ""}`}
                style={{ fontSize: 10.5, cursor: "pointer" }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {RANGE_OPTIONS.map((r) => (
              <button
                type="button"
                key={r.hours}
                onClick={() => {
                  setSinceHours(r.hours);
                  setPage(0);
                }}
                className={`pill ${sinceHours === r.hours ? "pill--ai" : ""}`}
                style={{ fontSize: 10.5, cursor: "pointer" }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Search size={13} className="text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="email · özet · hedef id"
              className="w-64 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm focus:border-text focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border-strong p-12 text-center text-sm text-text-muted">
          Bu filtreye uyan kayıt yok.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left">Zaman</th>
                <th className="px-4 py-2.5 text-left">Aktör</th>
                <th className="px-4 py-2.5 text-left">Olay</th>
                <th className="px-4 py-2.5 text-left">Özet</th>
                <th className="px-4 py-2.5 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <Row key={e.id} entry={e} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pager */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-text-muted">
          <span>
            Sayfa {data.page + 1} / {data.totalPages} · toplam{" "}
            {data.totalElements}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={data.page === 0}
              className="btn btn--outline btn--sm disabled:opacity-40"
            >
              <ChevronLeft size={12} /> Önceki
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={data.page + 1 >= data.totalPages}
              className="btn btn--outline btn--sm disabled:opacity-40"
            >
              Sonraki <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ entry }: { entry: AuditLogEntry }) {
  const ts = new Date(entry.createdAt);
  const tone = toneFor(entry.eventType);
  return (
    <tr className="border-t border-border align-top hover:bg-surface-2/40">
      <td className="px-4 py-2.5 font-mono text-[11.5px] text-text-2 whitespace-nowrap">
        {ts.toLocaleString("tr-TR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </td>
      <td className="px-4 py-2.5">
        <div className="text-text">{entry.actorEmail ?? "—"}</div>
        {entry.actorRole && (
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-text-muted">
            {entry.actorRole}
          </div>
        )}
      </td>
      <td className="px-4 py-2.5">
        <span className={`pill ${tone}`} style={{ fontSize: 10.5 }}>
          {entry.eventType}
        </span>
      </td>
      <td className="px-4 py-2.5 text-text">
        <div>{entry.summary ?? "—"}</div>
        {entry.targetType && (
          <div className="mt-0.5 font-mono text-[10.5px] text-text-muted">
            {entry.targetType}:{entry.targetId?.slice(0, 8) ?? "?"}
          </div>
        )}
      </td>
      <td className="px-4 py-2.5 font-mono text-[11px] text-text-muted whitespace-nowrap">
        {entry.ipAddress ?? "—"}
      </td>
    </tr>
  );
}

function toneFor(eventType: string): string {
  if (eventType.startsWith("auth.login.failed") || eventType.includes("banned")) {
    return "pill--danger";
  }
  if (eventType.startsWith("admin.") || eventType.startsWith("billing.")) {
    return "pill--ai";
  }
  if (eventType.startsWith("interview.")) return "pill--ai";
  return "";
}
