/* ============================================================
   Synapse — Hero AI Orb visualization
   ============================================================ */

function Orb() {
  // Counting score animation
  const [score, setScore] = React.useState(0);
  React.useEffect(() => {
    const target = 87;
    const dur = 1600;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setScore(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Particles
  const particles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="orb">
      <div className="orb__glow"></div>
      <div className="orb__ring orb__ring--outer"></div>
      <div className="orb__ring"></div>

      <div className="orb__disc">
        <div>
          <div>
            <span className="orb__score">{score}</span>
            <span className="orb__score-suffix">/100</span>
          </div>
          <div className="orb__label">YETKİNLİK SKORU</div>
        </div>
      </div>

      <span className="orb__chip orb__chip--a">
        <span className="orb__chip-dot" style={{ background: "#34d399" }}></span>
        React · doğrulandı
      </span>
      <span className="orb__chip orb__chip--b">
        <span className="orb__chip-dot" style={{ background: "#fbbf24" }}></span>
        TypeScript · orta
      </span>
      <span className="orb__chip orb__chip--c">
        <span className="orb__chip-dot" style={{ background: "#34d399" }}></span>
        Node.js · doğrulandı
      </span>
      <span className="orb__chip orb__chip--d">
        <span className="orb__chip-dot" style={{ background: "#a1a1aa" }}></span>
        GraphQL · zayıf
      </span>

      {particles.map((i) => (
        <span
          key={i}
          className="orb__particle"
          style={{
            animationDelay: `${-i * 1.3}s`,
            animationDuration: `${8 + i * 0.4}s`,
            background: i % 2 ? "hsl(calc(280 + var(--ai-hue)) 88% 70%)" : "hsl(calc(190 + var(--ai-hue)) 85% 60%)",
          }}
        ></span>
      ))}
    </div>
  );
}

window.Orb = Orb;
