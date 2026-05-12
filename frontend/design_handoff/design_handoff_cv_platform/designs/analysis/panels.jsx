/* ============================================================
   Analysis page panels — score, summary, skills, inconsistencies, github
   ============================================================ */

// ---------- Score Hero ----------
function ScoreHero({ score, active }) {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    if (!active) { setCount(0); return; }
    const start = performance.now();
    const dur = 1700;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, score]);

  const pillars = [
    { name: "Yetkinlik",     val: 91 },
    { name: "GitHub kanıtı", val: 84 },
    { name: "Tutarlılık",    val: 86 },
    { name: "Güven aralığı", val: 92, suffix: "%" },
  ];

  const verdict = score >= 85 ? "GÜÇLÜ ADAY" : score >= 65 ? "ORTA SEVİYE" : "GELİŞMELİ";

  return (
    <div className="card card--ai">
      <div className="score-hero">
        <div className="score-big">
          <div className="score-big__glow"></div>
          <div className="score-big__ring-outer"></div>
          <div className="score-big__progress" style={{ "--score": active ? score : 0 }}></div>
          <div className="score-big__inner">
            <div>
              <span className="score-big__num">{count}</span>
              <span className="score-big__suffix">/100</span>
              <div className="score-big__label">GENEL SKOR</div>
            </div>
          </div>
          <span className="score-big__verdict"><Icon.Sparkles width="12" height="12" /> {verdict}</span>
        </div>

        <div className="score-hero__meta">
          <div>
            <div className="score-hero__name">A. K. Yılmaz</div>
            <div className="score-hero__role">Senior Frontend Engineer · 6 yıl deneyim · İstanbul</div>
          </div>
          <div className="score-hero__pillars">
            {pillars.map((p, i) => (
              <div className="pillar" key={p.name}>
                <span className="pillar__name">{p.name}</span>
                <div className="pillar__bar">
                  <div
                    className="pillar__fill"
                    style={{ width: active ? `${p.val}%` : "0%", transitionDelay: `${200 + i * 120}ms` }}
                  ></div>
                </div>
                <span className="pillar__val">{p.val}{p.suffix || ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- AI Summary ----------
function Summary({ active }) {
  const [text, setText] = React.useState("");
  const full = "Aday, React ve Node.js'te ileri seviye kanıtlanmış katkıya sahip — son 2 yılda 340+ commit, çoğunlukla TypeScript. Mimari ve performans tarafında güçlü; SSR/Next.js örnekleri net. TypeScript kullanımı tutarlı ancak generic ve advanced patternlerde sınırlı. GraphQL beyanı GitHub aktivitesiyle yeterince desteklenmiyor — mülakatta sondalanmalı. PostgreSQL deneyimi orta, ileri sorgu optimizasyonu kanıtı yetersiz.";

  React.useEffect(() => {
    if (!active) { setText(""); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setText(full.slice(0, i));
      if (i >= full.length) { setText(full); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [active]);

  const done = text.length >= full.length;

  return (
    <div className="card">
      <div className="card__head">
        <div className="card__title">
          <span className="card__title-icon"><Icon.Sparkles /></span>
          AI Özeti
        </div>
        <span className="card__caption">GEMINI · v1.5</span>
      </div>
      <div className={`summary ${done ? "summary--done" : ""}`}>
        <div className="summary__body">{text || "\u00A0"}</div>
        <div className="summary__tags">
          <span className="pill pill--success"><Icon.Check width="12" height="12" /> Kanıtlı yetkinlik</span>
          <span className="pill pill--warning"><Icon.Alert width="12" height="12" /> 2 tutarsızlık</span>
          <span className="pill pill--muted">340+ commit / 18 ay</span>
          <span className="pill pill--muted">22 repo · 6 dil</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Skills card ----------
function Skills({ active }) {
  const cats = [
    {
      name: "Frontend", avg: 86, skills: [
        { name: "React", level: 92, chip: "high", label: "DOĞRULANDI" },
        { name: "Next.js", level: 88, chip: "high", label: "DOĞRULANDI" },
        { name: "TypeScript", level: 76, chip: "med", label: "ORTA" },
        { name: "Tailwind CSS", level: 84, chip: "high", label: "DOĞRULANDI" },
      ],
    },
    {
      name: "Backend", avg: 64, skills: [
        { name: "Node.js", level: 88, chip: "high", label: "DOĞRULANDI" },
        { name: "PostgreSQL", level: 64, chip: "med", label: "ORTA" },
        { name: "GraphQL", level: 32, chip: "low", label: "TUTARSIZ" },
      ],
    },
    {
      name: "Cloud & DevOps", avg: 58, skills: [
        { name: "Docker", level: 72, chip: "med", label: "ORTA" },
        { name: "AWS", level: 48, chip: "low", label: "ZAYIF" },
        { name: "CI/CD", level: 62, chip: "med", label: "ORTA" },
      ],
    },
  ];

  return (
    <div className="card skills-card">
      <div className="card__head">
        <div className="card__title">
          <span className="card__title-icon"><Icon.Activity /></span>
          Yetkinlik Dökümü
        </div>
        <span className="card__caption">10 SKILL · 3 KATEGORİ</span>
      </div>

      {cats.map((cat, ci) => (
        <div className="skill-cat" key={cat.name}>
          <div className="skill-cat__head">
            <span className="skill-cat__name">{cat.name}</span>
            <span className="skill-cat__avg">Ortalama · {cat.avg}/100</span>
          </div>
          {cat.skills.map((s, i) => {
            const idx = ci * 10 + i;
            return (
              <div className="skill-row" key={s.name}>
                <span className="skill-row__name">
                  <span className="skill-row__name-icon">{s.name[0]}</span>
                  {s.name}
                </span>
                <div className="skill-row__bar">
                  <div
                    className={`skill-row__fill skill-row__fill--${s.chip}`}
                    style={{ width: active ? `${s.level}%` : "0%", transitionDelay: `${150 + idx * 80}ms` }}
                  ></div>
                </div>
                <div className="skill-row__meta">
                  <span className="skill-row__pct">{s.level}</span>
                  <span className={`skill-row__chip skill-row__chip--${s.chip}`}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------- Inconsistencies ----------
function Inconsistencies() {
  const [open, setOpen] = React.useState({ 0: false, 1: false });
  const items = [
    {
      tag: "TUTARSIZLIK",
      title: "GraphQL beyanı kanıtla desteklenmiyor",
      desc: "CV'de \"ileri seviye GraphQL\" beyanı var, ancak GitHub'da bu kategoride toplam 4 commit ve 1 küçük resolver dosyası tespit edildi. Son 12 ayda aktivite sıfır.",
      detail: "Kanıt: synapse-app/backend · 1 resolver dosyası (2024-03)\nBeyan: 'Senior-level GraphQL ile mikroservis API tasarımı'\nÖneri: Mülakatta teknik sondalama yapılmalı.",
    },
    {
      tag: "EKSİK KANIT",
      title: "AWS deneyimi yetersiz örneklenmiş",
      desc: "3 yıl AWS beyanı ile public repo'larda terraform / infra dosyaları az. Private projelerde olabilir, ancak doğrulanamadı.",
      detail: "Public repolarda IaC tespit edilmedi.\nCV'de Lambda, S3, RDS, CloudFront sayılmış.\nÖneri: Adaydan örnek proje veya mimari diagram istenebilir.",
    },
  ];

  return (
    <div className="card">
      <div className="card__head">
        <div className="card__title">
          <span className="card__title-icon" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", borderColor: "rgba(239,68,68,0.25)" }}>
            <Icon.Alert width="16" height="16" />
          </span>
          Tutarsızlıklar
        </div>
        <span className="card__caption">{items.length} BULGU</span>
      </div>
      <div className="incon-list">
        {items.map((it, i) => (
          <div
            className="incon"
            key={i}
            data-open={open[i] ? "true" : "false"}
            onClick={() => setOpen({ ...open, [i]: !open[i] })}
          >
            <div className="incon__icon"><Icon.Alert width="14" height="14" /></div>
            <div className="incon__body">
              <div className="incon__title">
                {it.title}
                <span className="incon__tag">{it.tag}</span>
              </div>
              <div className="incon__desc">{it.desc}</div>
              <div className="incon__detail">{it.detail.split("\n").map((l, j) => <div key={j}>{l}</div>)}</div>
            </div>
            <Icon.Chevron className="incon__chev" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- GitHub evidence ----------
function GithubEvidence({ active }) {
  const langs = [
    { name: "TypeScript", pct: 42, color: "#3178c6" },
    { name: "JavaScript", pct: 26, color: "#f7df1e" },
    { name: "Python",     pct: 14, color: "#3776ab" },
    { name: "Go",         pct: 10, color: "#00add8" },
    { name: "Diğer",      pct: 8,  color: "#71717a" },
  ];

  // deterministic calendar
  const cells = Array.from({ length: 26 * 7 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280 / 233280;
    const lvl = seed > 0.88 ? 4 : seed > 0.7 ? 3 : seed > 0.45 ? 2 : seed > 0.25 ? 1 : 0;
    return lvl;
  });
  const cellColor = (lvl) => {
    if (lvl === 0) return "var(--surface-2)";
    const a = [0.20, 0.40, 0.65, 0.95][lvl - 1];
    return `rgba(16,185,129,${a})`;
  };

  const repos = [
    { name: "synapse-app/web",       stars: 312, lang: "TypeScript", color: "#3178c6", meta: "Son commit 2 gün önce" },
    { name: "akyilmaz/react-flow-x", stars: 184, lang: "TypeScript", color: "#3178c6", meta: "Son commit 1 hafta önce" },
    { name: "akyilmaz/edge-rate",    stars: 88,  lang: "Go",          color: "#00add8", meta: "Son commit 3 hafta önce" },
  ];

  return (
    <div className="card">
      <div className="card__head">
        <div className="card__title">
          <span className="card__title-icon"><Icon.Github width="16" height="16" /></span>
          GitHub Kanıtı
        </div>
        <span className="card__caption">@akyilmaz · BAĞLI</span>
      </div>

      <div className="gh-grid">
        <div className="gh-stat">
          <span className="gh-stat__label">Commit · 12ay</span>
          <span className="gh-stat__num">342</span>
          <span className="gh-stat__delta">+18% önceki yıla göre</span>
        </div>
        <div className="gh-stat">
          <span className="gh-stat__label">Repo (public)</span>
          <span className="gh-stat__num">22</span>
          <span className="gh-stat__delta">6 dil</span>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="mono-sm">DİL DAĞILIMI</span>
          <span className="mono-sm muted">SON 12 AY</span>
        </div>
        <div className="gh-lang-bar">
          {langs.map((l) => (
            <div key={l.name} style={{ background: l.color, width: active ? `${l.pct}%` : "0%" }}></div>
          ))}
        </div>
        <div className="gh-langs__legend" style={{ marginTop: 10 }}>
          {langs.map((l) => (
            <span key={l.name}>
              <span className="gh-langs__dot" style={{ background: l.color }}></span>
              {l.name} {l.pct}%
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="mono-sm">KATKI TAKVİMİ</span>
          <span className="mono-sm muted">26 HAFTA</span>
        </div>
        <div className="gh-calendar">
          {cells.map((lvl, i) => (
            <div
              key={i}
              className="gh-cell"
              style={{
                background: active ? cellColor(lvl) : "var(--surface-2)",
                transition: `background 600ms ${i * 1.5}ms`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="gh-repos">
        {repos.map((r) => (
          <div className="gh-repo" key={r.name}>
            <Icon.Github width="14" height="14" />
            <div>
              <div className="gh-repo__name">{r.name}</div>
              <div className="gh-repo__meta">{r.meta}</div>
            </div>
            <span className="gh-repo__lang">
              <span className="gh-repo__lang-dot" style={{ background: r.color }}></span>
              {r.lang}
            </span>
            <span className="gh-repo__stars"><Icon.Star /> {r.stars}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ScoreHero = ScoreHero;
window.Summary = Summary;
window.Skills = Skills;
window.Inconsistencies = Inconsistencies;
window.GithubEvidence = GithubEvidence;
