"use client";

const SPARK_POSITIONS = [
  { top: "12%", left: "20%", delay: "0s" },
  { top: "22%", right: "18%", delay: "0.5s" },
  { top: "45%", left: "8%", delay: "1.1s" },
  { top: "55%", right: "10%", delay: "1.6s" },
  { bottom: "20%", left: "25%", delay: "2.1s" },
  { bottom: "12%", right: "30%", delay: "2.6s" },
  { top: "35%", left: "48%", delay: "0.3s" },
  { bottom: "32%", right: "42%", delay: "1.4s" },
];

export function AuthOrb() {
  return (
    <div className="auth-orb">
      <div className="auth-orb__ring" />
      <div className="auth-orb__ring auth-orb__ring--2" />
      <div className="auth-orb__ring auth-orb__ring--3" />
      <div className="auth-orb__core" />
      {SPARK_POSITIONS.map((p, i) => (
        <span
          key={i}
          className="auth-spark"
          style={{ ...p, animationDelay: p.delay } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
