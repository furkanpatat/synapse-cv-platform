"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { Bot, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";

import { aiDetectionApi, type AiDetectionResponse } from "@/lib/ai-detection-api";
import { Button } from "@/components/ui/Button";
import type { ApiError } from "@/types/auth";

interface Props {
  applicationId: string;
  /** Existing detection result (if already cached on the application). */
  initial?: AiDetectionResponse | null;
}

/**
 * Company-only card that runs the AI-content detector against the
 * candidate's CV text + bio. Hybrid heuristic + Gemini judge — the
 * backend caches the result on the Application row so re-clicks are free.
 */
export function AiContentDetectionCard({ applicationId, initial }: Props) {
  const [data, setData] = useState<AiDetectionResponse | null>(initial ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await aiDetectionApi.detect(applicationId);
      setData(r);
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      setError(e.response?.data?.message ?? "Tespit başlatılamadı");
    } finally {
      setBusy(false);
    }
  };

  const verdictColor =
    data?.verdict === "AI_LIKELY"
      ? "text-red-400 border-red-500/30 bg-red-500/5"
      : data?.verdict === "SUSPICIOUS"
        ? "text-amber-400 border-amber-500/30 bg-amber-500/5"
        : data
          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
          : "border-border";

  const verdictLabel =
    data?.verdict === "AI_LIKELY"
      ? "LLM tarafından yazılmış olabilir"
      : data?.verdict === "SUSPICIOUS"
        ? "Şüpheli — manuel inceleme öner"
        : "Büyük ihtimalle insan yazdı";

  const VerdictIcon =
    data?.verdict === "AI_LIKELY"
      ? Bot
      : data?.verdict === "SUSPICIOUS"
        ? ShieldAlert
        : ShieldCheck;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl ai-grad text-white shrink-0">
          <Bot size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-[-0.015em]">
            AI-yazımı tespiti
          </h3>
          <p className="mt-0.5 text-[12.5px] text-text-2">
            Adayın CV metnini ChatGPT/Gemini gibi bir LLM yazmış mı? Heuristik
            sinyaller + Gemini hakemi birleşik değerlendirmesi.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-[12.5px] text-red-300">
          {error}
        </div>
      )}

      {!data ? (
        <Button onClick={run} loading={busy} variant="ai" size="sm">
          <Sparkles size={13} /> CV&apos;yi analiz et
        </Button>
      ) : (
        <div className="space-y-3">
          <div className={`flex items-center gap-3 rounded-md border p-3 ${verdictColor}`}>
            <VerdictIcon size={20} />
            <div className="flex-1">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] opacity-80">
                {data.probability}/100 LLM ihtimal
              </div>
              <div className="text-[14px] font-medium">{verdictLabel}</div>
            </div>
          </div>

          {data.reason && (
            <p className="text-[13px] leading-snug text-text-2">{data.reason}</p>
          )}

          {data.signals && data.signals.length > 0 && (
            <div>
              <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                Tespit edilen sinyaller
              </div>
              <ul className="space-y-1 text-[12.5px] text-text-2">
                {data.signals.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-text-muted">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="text-[12px] font-mono uppercase tracking-[0.14em] text-text-muted hover:text-text disabled:opacity-50"
          >
            {busy ? "Tekrar çalışıyor..." : "Yeniden çalıştır"}
          </button>
        </div>
      )}
    </div>
  );
}
