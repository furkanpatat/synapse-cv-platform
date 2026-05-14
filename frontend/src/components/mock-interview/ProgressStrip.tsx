"use client";

import type { AvatarState } from "./Avatar";

interface Props {
  idx: number;
  total: number;
  state: AvatarState;
}

/**
 * Progress bar at the top of the right column. Renders one 4-px segment
 * per question — completed segments are emerald, current is accent (with
 * a shimmer overlay while the AI is mid-speech), pending are faint white.
 *
 * Right side shows mono "01/05 · ~ 2 dk kaldı" — the estimate is a rough
 * heuristic (~30 s per remaining question) so we don't pretend to know
 * exactly how long the candidate will take.
 */
export function ProgressStrip({ idx, total, state }: Props) {
  const remaining = Math.max(0, total - idx);
  const estMinutes = Math.max(1, Math.round((remaining * 30) / 60));

  return (
    <div className="mb-3.5 flex items-center gap-[18px] rounded-[10px] border border-border bg-surface px-4 py-3">
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < idx;
          const now = i === idx;
          const animated = now && state === "speaking";
          return (
            <div
              key={i}
              className="relative h-1 flex-1 overflow-hidden rounded-[2px]"
              style={{
                background: done
                  ? "#34d399"
                  : now
                    ? "#a78bfa"
                    : "rgba(255,255,255,0.07)",
              }}
            >
              {animated && (
                <div className="absolute inset-0 mi-pbar-shimmer" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.06em] text-text-muted">
        <span>
          {String(idx + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <span className="h-[3px] w-[3px] rounded-full bg-text-muted" />
        <span>~ {estMinutes} dk kaldı</span>
      </div>
    </div>
  );
}
