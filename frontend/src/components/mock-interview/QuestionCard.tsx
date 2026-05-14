"use client";

import { RefreshCw, Sparkles } from "lucide-react";

import type { AvatarState } from "./Avatar";
import { Typewriter } from "./Typewriter";

interface Props {
  state: AvatarState;
  question: string;
  idx: number;
  total: number;
  muted: boolean;
  onRepeat: () => void;
}

/**
 * The "AI's current question" card. Pad-rich, typewriter on speaking,
 * skeleton shimmer between/finalizing, accent glow border when speaking.
 *
 * We expose the full question to AT via aria-label on the paragraph — the
 * typewriter visual is dropped for keyboard / screen reader users.
 */
export function QuestionCard({
  state,
  question,
  idx,
  total,
  muted,
  onRepeat,
}: Props) {
  const isHidden = state === "between" || state === "finalizing";
  const isActive = state === "speaking";

  return (
    <div
      className="relative rounded-[14px] border bg-surface px-6 pb-5 pt-[22px] transition-[border-color] duration-200"
      style={
        isActive
          ? {
              borderColor: "rgba(167,139,250,0.28)",
              boxShadow:
                "0 0 0 1px rgba(167,139,250,0.10), 0 0 32px -16px rgba(167,139,250,0.32)",
            }
          : { borderColor: "var(--border)" }
      }
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
          <Sparkles size={11} style={{ color: "#a78bfa" }} />
          SORU · {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
        <button
          type="button"
          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-surface-2 text-text-2 transition hover:border-border-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onRepeat}
          disabled={muted}
          title="Soruyu tekrar dinle"
          aria-label="Soruyu tekrar dinle"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {isHidden ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <span className="mi-sk-bar h-[14px] rounded-[4px]" style={{ width: "92%" }} />
          <span className="mi-sk-bar h-[14px] rounded-[4px]" style={{ width: "78%" }} />
          <span className="mi-sk-bar h-[14px] rounded-[4px]" style={{ width: "54%" }} />
        </div>
      ) : (
        <p
          className="m-0 text-[20px] font-medium leading-[1.4] tracking-[-0.015em] text-text"
          style={{ textWrap: "pretty", minHeight: "2.2em" } as React.CSSProperties}
          aria-label={question}
        >
          {isActive ? <Typewriter text={question} key={question + idx} /> : question}
        </p>
      )}

      {muted && state === "speaking" && (
        <p className="mt-2.5 font-mono text-[12px] tracking-[0.04em] text-text-muted">
          Sessiz mod açık — Mira soruyu sesli sormadı. Hazır olduğunda cevapla.
        </p>
      )}
    </div>
  );
}
