"use client";

import { useEffect, useState } from "react";

interface Chip {
  label: string;
  position: "a" | "b" | "c" | "d";
  tone: "success" | "warning" | "muted";
}

interface Props {
  score?: number;
  label?: string;
  chips?: Chip[];
}

const POS: Record<Chip["position"], React.CSSProperties> = {
  a: { top: "8%", left: "-8%", animationDelay: "0s" },
  b: { top: "28%", right: "-10%", animationDelay: "-1.5s" },
  c: { bottom: "18%", left: "-12%", animationDelay: "-3s" },
  d: { bottom: "6%", right: "-4%", animationDelay: "-4.5s" },
};

const DOT: Record<Chip["tone"], string> = {
  success: "#34d399",
  warning: "#fbbf24",
  muted: "#a1a1aa",
};

export function AiOrb({
  score = 87,
  label = "YETKİNLİK SKORU",
  chips = [
    { label: "React · doğrulandı", position: "a", tone: "success" },
    { label: "TypeScript · orta", position: "b", tone: "warning" },
    { label: "Node.js · doğrulandı", position: "c", tone: "success" },
    { label: "GraphQL · zayıf", position: "d", tone: "muted" },
  ],
}: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1600;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="orb">
      <div className="orb__glow" />
      <div className="orb__ring orb__ring--outer" />
      <div className="orb__ring" />

      <div className="orb__disc">
        <div>
          <div>
            <span className="orb__score">{display}</span>
            <span className="orb__score-suffix">/100</span>
          </div>
          <div className="orb__label">{label}</div>
        </div>
      </div>

      {chips.map((c) => (
        <span
          key={c.position}
          className={`orb__chip orb__chip--${c.position}`}
          style={POS[c.position]}
        >
          <span className="orb__chip-dot" style={{ background: DOT[c.tone] }} />
          {c.label}
        </span>
      ))}

      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="orb__particle"
          style={{
            animationDelay: `${-i * 1.3}s`,
            animationDuration: `${8 + i * 0.4}s`,
            background:
              i % 2
                ? "hsl(calc(280 + var(--ai-hue)) 88% 70%)"
                : "hsl(calc(190 + var(--ai-hue)) 85% 60%)",
          }}
        />
      ))}
    </div>
  );
}
