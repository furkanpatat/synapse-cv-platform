"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  name: string;
  score: number;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  delayMs?: number;
}

const TONE: Record<NonNullable<Props["confidence"]>, string> = {
  HIGH: "skill-bar__fill--high",
  MEDIUM: "skill-bar__fill--medium",
  LOW: "skill-bar__fill--low",
};

const LABEL: Record<NonNullable<Props["confidence"]>, string> = {
  HIGH: "Yüksek",
  MEDIUM: "Orta",
  LOW: "Düşük",
};

export function SkillBar({ name, score, confidence = "MEDIUM", delayMs = 0 }: Props) {
  const [filled, setFilled] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => setFilled(score), delayMs);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [score, delayMs]);

  return (
    <div ref={ref}>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-text">{name}</span>
        <div className="flex items-center gap-2">
          <span
            className={`pill pill--${
              confidence === "HIGH"
                ? "success"
                : confidence === "MEDIUM"
                  ? "warning"
                  : "muted"
            }`}
            style={{ fontSize: 10, padding: "2px 8px" }}
          >
            {LABEL[confidence]}
          </span>
          <span className="font-mono text-xs text-text-2">{score}</span>
        </div>
      </div>
      <div className="skill-bar__track">
        <div
          className={`skill-bar__fill ${TONE[confidence]}`}
          style={{ width: `${filled}%` }}
        />
      </div>
    </div>
  );
}
