"use client";

import type { AvatarState } from "./Avatar";

interface Props {
  state: AvatarState;
}

const PALETTE = {
  ai: {
    dot: "#a78bfa",
    text: "#e9e1ff",
    border: "rgba(167,139,250,0.32)",
    bg: "rgba(167,139,250,0.08)",
  },
  emerald: {
    dot: "#34d399",
    text: "#bbf2d8",
    border: "rgba(52,211,153,0.32)",
    bg: "rgba(52,211,153,0.08)",
  },
  amber: {
    dot: "#fbbf24",
    text: "#fde6a8",
    border: "rgba(251,191,36,0.32)",
    bg: "rgba(251,191,36,0.08)",
  },
  muted: {
    dot: "rgba(255,255,255,0.4)",
    text: "rgba(255,255,255,0.7)",
    border: "rgba(255,255,255,0.12)",
    bg: "rgba(255,255,255,0.03)",
  },
};

function statusOf(state: AvatarState) {
  switch (state) {
    case "speaking":
      return { txt: "AI konuşuyor", colour: PALETTE.ai, dotKind: "pulse" as const };
    case "listening":
      return { txt: "Seni dinliyor", colour: PALETTE.emerald, dotKind: "live" as const };
    case "thinking":
      return {
        txt: "AI cevabını değerlendiriyor",
        colour: PALETTE.amber,
        dotKind: "pulse" as const,
      };
    case "between":
      return {
        txt: "Cevabın kaydediliyor",
        colour: PALETTE.muted,
        dotKind: "soft" as const,
      };
    case "finalizing":
      return {
        txt: "Mülakat sonlanıyor",
        colour: PALETTE.ai,
        dotKind: "pulse" as const,
      };
  }
}

export function StatusPill({ state }: Props) {
  const s = statusOf(state);
  const p = s.colour;
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border px-2.5 py-[5px] pl-2 font-mono text-[11px] tracking-[0.08em] backdrop-blur-sm"
      style={{ color: p.text, borderColor: p.border, background: p.bg }}
    >
      <span
        className={
          s.dotKind === "pulse"
            ? "mi-status-dot mi-status-dot--pulse"
            : s.dotKind === "live"
              ? "mi-status-dot mi-status-dot--live"
              : "mi-status-dot mi-status-dot--soft"
        }
        style={{ background: p.dot, ["--mi-dot" as string]: p.dot }}
      />
      {s.txt}
    </span>
  );
}
