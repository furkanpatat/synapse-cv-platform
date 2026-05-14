"use client";

import { useMemo } from "react";
import { Keyboard, Mic, Sparkles } from "lucide-react";

import { normaliseTechTerms } from "@/lib/transcript-cleanup";
import type { AvatarState } from "./Avatar";

interface Props {
  state: AvatarState;
  inputMode: "voice" | "text";
  // Voice mode
  finalTranscript: string;
  interimText: string;
  // Text mode
  draft: string;
  setDraft: (s: string) => void;
}

function wordCount(s: string): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Live transcript / textarea hybrid. In voice mode we show finalised
 * speech in body type and the interim (still-changing) chunk in a muted
 * span. In text mode the body is replaced by a textarea. Both feed the
 * same submit pipeline upstream — the only branching is here in the view.
 */
export function TranscriptCard({
  state,
  inputMode,
  finalTranscript,
  interimText,
  draft,
  setDraft,
}: Props) {
  // Normalise tech terms live so users see "React" instead of "riakt" as
  // they speak — same pipeline that's applied again at submit time.
  const finalClean = useMemo(
    () => normaliseTechTerms(finalTranscript ?? ""),
    [finalTranscript]
  );
  const interimClean = useMemo(
    () => normaliseTechTerms(interimText ?? ""),
    [interimText]
  );

  const totalWords =
    inputMode === "text"
      ? wordCount(draft)
      : wordCount(finalClean) + wordCount(interimClean);

  const placeholder =
    inputMode === "text"
      ? "Cevabını buraya yaz — Mira yazdığını da değerlendiriyor."
      : "Konuşmaya başla, sözlerin anlık buraya yazılacak.";

  return (
    <div
      className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-surface px-[22px] pb-3.5 pt-[18px]"
      style={{ minHeight: 200 }}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
          {state === "listening" ? (
            <>
              <span
                className="mr-2 inline-block h-[7px] w-[7px] rounded-full mi-status-dot mi-status-dot--live"
                style={{
                  background: "#34d399",
                  ["--mi-dot" as string]: "#34d399",
                  boxShadow: "0 0 8px #34d399",
                }}
              />
              CANLI TRANSKRİPT
            </>
          ) : inputMode === "text" ? (
            <>
              <Keyboard size={11} style={{ color: "#a78bfa" }} />
              YAZILI CEVAP
            </>
          ) : (
            <>
              <Mic size={11} style={{ color: "#a78bfa" }} />
              CEVAP
            </>
          )}
        </div>
        <div className="font-mono text-[10.5px] text-text-muted">
          {totalWords} kelime
        </div>
      </div>

      {inputMode === "text" ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="mi-textarea flex-1 resize-y rounded-lg border border-border bg-transparent px-3.5 py-3 text-[14.5px] leading-[1.6] text-text outline-none transition-colors"
          style={{ minHeight: 120 }}
        />
      ) : finalClean || interimClean ? (
        <p className="m-0 flex-1 text-[14.5px] leading-[1.6] text-text">
          {finalClean && <span>{finalClean} </span>}
          {interimClean && (
            <span className="italic text-text-muted">{interimClean}</span>
          )}
        </p>
      ) : (
        <p className="m-0 flex-1 text-[14.5px] italic leading-[1.6] text-text-muted">
          {placeholder}
        </p>
      )}

      <div className="border-t border-dashed border-border pt-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.06em] text-text-muted">
          <Sparkles size={10} style={{ color: "#a78bfa" }} />
          Teknik terimleri otomatik düzeltiriz · STAR formatı bonus puan
        </span>
      </div>
    </div>
  );
}
