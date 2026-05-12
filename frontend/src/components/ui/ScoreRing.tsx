"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  size?: "sm" | "md" | "xl";
  label?: string;
  className?: string;
  animate?: boolean;
}

const SIZES = {
  sm: { dim: 56, ring: 6, num: 18 },
  md: { dim: 120, ring: 10, num: 36 },
  xl: { dim: 260, ring: 14, num: 72 },
};

export function ScoreRing({
  score,
  size = "md",
  label,
  className,
  animate = true,
}: Props) {
  const { dim, ring, num } = SIZES[size];
  const [displayed, setDisplayed] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayed(score);
      return;
    }
    const start = performance.now();
    const dur = 1200;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, animate]);

  return (
    <div
      className={cn("score-ring", className)}
      style={
        {
          width: dim,
          height: dim,
          "--ring-pct": `${displayed}%`,
          "--ring-width": `${ring}px`,
        } as React.CSSProperties
      }
    >
      <div className="score-ring__bg" />
      <div className="score-ring__inner">
        <div className="score-ring__num" style={{ fontSize: num }}>
          {displayed}
          <span style={{ fontSize: num * 0.34, color: "var(--text-muted)" }}>
            /100
          </span>
        </div>
        {label && <div className="score-ring__label">{label}</div>}
      </div>
    </div>
  );
}
