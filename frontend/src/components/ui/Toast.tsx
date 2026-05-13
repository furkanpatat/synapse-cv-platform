"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { Check, X, AlertTriangle, Info, Sparkles } from "lucide-react";

export type ToastTone = "success" | "error" | "warning" | "info" | "ai";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
  durationMs: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "durationMs"> & { durationMs?: number }) => number;
  dismiss: (id: number) => void;
}

let counter = 1;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = counter++;
    set((s) => ({
      toasts: [...s.toasts, { id, durationMs: 4500, ...t }],
    }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Helper for ergonomic use anywhere */
export const toast = {
  success: (title: string, body?: string) =>
    useToastStore.getState().push({ tone: "success", title, body }),
  error: (title: string, body?: string) =>
    useToastStore.getState().push({ tone: "error", title, body, durationMs: 6000 }),
  warning: (title: string, body?: string) =>
    useToastStore.getState().push({ tone: "warning", title, body }),
  info: (title: string, body?: string) =>
    useToastStore.getState().push({ tone: "info", title, body }),
  ai: (title: string, body?: string) =>
    useToastStore.getState().push({ tone: "ai", title, body }),
};

const ICONS: Record<ToastTone, React.ReactNode> = {
  success: <Check size={14} className="text-emerald-400" />,
  error: <X size={14} className="text-red-400" />,
  warning: <AlertTriangle size={14} className="text-amber-400" />,
  info: <Info size={14} className="text-ai-2" />,
  ai: <Sparkles size={14} className="text-white" />,
};

const TONE_CLASS: Record<ToastTone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-red-500/30 bg-red-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  info: "border-ai-2/30 bg-ai-2/5",
  ai: "border-transparent ai-grad text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)]",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, t.durationMs);
    return () => clearTimeout(id);
  }, [t.durationMs, onDismiss]);

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-[var(--radius)] border p-3 backdrop-blur-md ${TONE_CLASS[t.tone]}`}
      style={
        t.tone === "ai"
          ? undefined
          : { background: "color-mix(in oklab, var(--surface) 88%, transparent)" }
      }
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${
            t.tone === "ai" ? "bg-white/15" : "bg-surface-2"
          }`}
        >
          {ICONS[t.tone]}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[13px] font-medium leading-snug ${
              t.tone === "ai" ? "text-white" : "text-text"
            }`}
          >
            {t.title}
          </p>
          {t.body && (
            <p
              className={`mt-0.5 text-[12px] leading-snug ${
                t.tone === "ai" ? "text-white/85" : "text-text-2"
              }`}
            >
              {t.body}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 rounded-md p-1 transition ${
            t.tone === "ai"
              ? "text-white/80 hover:bg-white/15 hover:text-white"
              : "text-text-muted hover:bg-surface-2 hover:text-text"
          }`}
          aria-label="Kapat"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
