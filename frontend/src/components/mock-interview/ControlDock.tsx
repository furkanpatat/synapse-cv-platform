"use client";

import {
  ArrowRight,
  Keyboard,
  Mic,
  MicOff,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

import type { AvatarState } from "./Avatar";

interface Props {
  state: AvatarState;
  inputMode: "voice" | "text";
  setInputMode: (m: "voice" | "text") => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  onClear: () => void;
  onNext: () => void;
  onToggleMic: () => void;
  /** True when this is the last question — Next button label flips. */
  isLast: boolean;
  /** True when there's enough content to submit — drives Next disabled state. */
  canSubmit: boolean;
  /** True while the parent is awaiting submit/finalize. */
  busy: boolean;
}

/**
 * Two-row dock at the bottom of the right column.
 *
 *   Top:    [Voice|Text toggle]              [vol] [trash]
 *   Bottom: [Big mic / Text-mode CTA]        [Next →]
 *
 * The mic button stretches to fill the row in voice mode (and pulses
 * accent-coloured while actively listening). In text mode it's replaced
 * by a dashed info card pointing at the textarea above.
 */
export function ControlDock({
  state,
  inputMode,
  setInputMode,
  muted,
  setMuted,
  onClear,
  onNext,
  onToggleMic,
  isLast,
  canSubmit,
  busy,
}: Props) {
  const listening = state === "listening";
  const accent = "#a78bfa";

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface px-4 py-3.5">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2.5">
        <div
          role="tablist"
          className="inline-flex overflow-hidden rounded-full border border-border bg-surface-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "voice"}
            onClick={() => setInputMode("voice")}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] font-mono text-[11.5px] tracking-[0.06em] transition"
            style={
              inputMode === "voice"
                ? { background: accent, color: "#fff" }
                : { background: "transparent", color: "var(--text-2)" }
            }
          >
            <Mic size={12} /> Sesli
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "text"}
            onClick={() => setInputMode("text")}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] font-mono text-[11.5px] tracking-[0.06em] transition"
            style={
              inputMode === "text"
                ? { background: accent, color: "#fff" }
                : { background: "transparent", color: "var(--text-2)" }
            }
          >
            <Keyboard size={12} /> Yazılı
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            title={muted ? "Sesi aç" : "Sessize al"}
            aria-label={muted ? "Sesi aç" : "Sessize al"}
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-surface-2 text-text-2 transition hover:border-border-strong hover:text-text"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            type="button"
            onClick={onClear}
            title="Cevabı temizle"
            aria-label="Cevabı temizle"
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-surface-2 text-text-2 transition hover:border-border-strong hover:text-text"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center gap-2.5">
        {inputMode === "voice" ? (
          <button
            type="button"
            onClick={onToggleMic}
            className="mi-mic-big flex flex-1 items-center gap-3 rounded-full border px-[18px] py-3.5 text-[13.5px] font-medium transition"
            style={
              listening
                ? { background: accent, borderColor: accent, color: "#fff" }
                : {
                    background: "var(--surface-2)",
                    borderColor: "var(--border-strong)",
                    color: "var(--text)",
                  }
            }
            aria-label={listening ? "Dinlemeyi durdur" : "Konuşmaya başla"}
            data-mi-mic-on={listening ? "true" : "false"}
          >
            {listening ? <Mic size={20} /> : <MicOff size={20} />}
            <span>
              {listening
                ? "Dinleniyor — tekrar bas ve durdur"
                : "Konuşmak için bas"}
            </span>
          </button>
        ) : (
          <div
            className="flex flex-1 items-center gap-2.5 rounded-xl border border-dashed px-[18px] py-3.5 text-[13px] text-text-2"
            style={{ borderColor: "var(--border-strong)" }}
          >
            <Keyboard size={14} style={{ color: accent }} />
            <span>Yazma modundayken cevabını yukarıdaki editöre yaz</span>
          </div>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={!canSubmit || busy}
          className="inline-flex items-center gap-2 rounded-full border px-5 py-3.5 text-[13.5px] font-medium transition hover:brightness-110 disabled:cursor-not-allowed"
          style={
            !canSubmit || busy
              ? {
                  background: "var(--surface-2)",
                  color: "var(--text-muted)",
                  borderColor: "var(--border)",
                  opacity: 0.35,
                }
              : {
                  background: accent,
                  color: "#fff",
                  borderColor: accent,
                }
          }
        >
          {isLast ? "Bitir & değerlendir" : "Sonraki soru"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
