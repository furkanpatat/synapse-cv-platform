"use client";

import { useEffect, useState } from "react";

import type { AvatarState } from "./Avatar";

interface Props {
  state: AvatarState;
}

/**
 * 48-bar waveform that lives between the avatar and the role card. Bars are
 * driven by a single rAF loop while either party is "actively producing
 * sound" (speaking from the AI side, listening to the user). Otherwise we
 * fall back to a near-flat decorative state so the stage doesn't feel dead.
 *
 * The envelope tapers the bars at the edges so the visualisation reads as
 * a centred energy peak — same idea as Apple's "Hey Siri" waveform.
 */
export function StageWave({ state }: Props) {
  const active = state === "speaking" || state === "listening";
  const BARS = 48;
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 700);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const colour = state === "listening" ? "#34d399" : "#a78bfa";

  return (
    <div className="border-y border-dashed border-border px-3 py-2">
      <svg
        viewBox={`0 0 ${BARS * 8} 60`}
        width="100%"
        height={60}
        preserveAspectRatio="none"
      >
        {Array.from({ length: BARS }).map((_, i) => {
          const dist = Math.abs(i - BARS / 2) / (BARS / 2);
          const envelope = 1 - dist * 0.65;
          const phase = (i / BARS) * Math.PI * 6 + t;
          const h = active
            ? 6 +
              Math.abs(Math.sin(phase) * Math.cos(phase * 0.7 + i * 0.4)) *
                38 *
                envelope
            : 4 + (i % 3);
          return (
            <rect
              key={i}
              x={i * 8 + 2}
              y={(60 - h) / 2}
              width={4}
              height={h}
              fill={active ? colour : "rgba(255,255,255,0.18)"}
              rx={2}
              opacity={active ? 0.85 : 0.4}
            />
          );
        })}
      </svg>
    </div>
  );
}
