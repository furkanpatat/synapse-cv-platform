/* ============================================================
   Jobs (list + detail) + Profile pages
   ============================================================ */

// extra icons for this page
Object.assign(Icon, {
  Search: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
    </svg>
  ),
  MapPin: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Cash: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>
    </svg>
  ),
  Bookmark: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Share: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  ),
});

const JOBS_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "aiIntensity": 0.7,
  "aiHue": 0,
  "page": "list"
}/*EDITMODE-END*/;

// ---------- Shared user sidebar ----------
function UserSidebar({ active, theme, setTheme }) {
  const items = [
    { icon: <Icon.Home className="sidebar__icon" />,      label: "Panel",        key: "home" },
    { icon: <Icon.FileText className="sidebar__icon" />,  label: "CV'm",          key: "cv" },
    { icon: <Icon.Brain className="sidebar__icon" />,     label: "AI Analiz",     badge: "AI", key: "ai" },
    { icon: <Icon.Briefcase className="sidebar__icon" />, label: "İlanlar",       key: "jobs" },
    { icon: <Icon.Inbox className="sidebar__icon" />,     label: "Başvurularım",  count: 8, key: "apps" },
    { icon: <Icon.Message className="sidebar__icon" />,   label: "Mesajlar",      count: 3, key: "msg" },
  ];
  const account = [
    { icon: <Icon.User className="sidebar__icon" />,  label: "Profil",    key: "profile" },
    { icon: <Icon.Crown className="sidebar__icon" />, label: "Abonelik",  key: "billing" },
  ];
  const item = (it, i) => (
    <a key={i} className={`sidebar__item ${active === it.key ? "sidebar__item--active" : ""}`}>
      {it.icon}<span>{it.label}</span>
      {it.badge && <span className="sidebar__badge sidebar__badge--ai">{it.badge}</span>}
      {it.count != null && <span className="sidebar__badge">{it.count}</span>}
    </a>
  );
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark"><Icon.Logo /></span>
        Synapse
      </div>
      <div className="sidebar__section">Çalışma alanı</div>
      <nav className="sidebar__nav">{items.map(item)}</nav>
      <div className="sidebar__section">Hesap</div>
      <nav className="sidebar__nav">{account.map(item)}</nav>
      <div className="sidebar__footer">
        <div className="row" style={{ marginBottom: 10, paddingLeft: 6 }}>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <span className="mono-sm">{theme === "dark" ? "Karanlık" : "Aydınlık"}</span>
        </div>
        <div className="sidebar__user">
          <div className="sidebar__avatar" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>AY</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">A. K. Yılmaz</div>
            <div className="sidebar__user-plan">FREE · 1/3 kullanım</div>
          </div>
          <Icon.Chevron className="sidebar__icon" style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    </aside>
  );
}

// ---------- Mini match ring ----------
function MatchRing({ match, size = 44 }) {
  return (
    <div className="job-card__match" style={{ width: size, height: size }}>
      <div className="job__match-ring" style={{ "--m": match }}></div>
      <div className="job__match-num" style={{ fontSize: size > 50 ? 13 : 12 }}>%{match}</div>
    </div>
  );
}

// ---------- Featured carousel (jobs list) ----------
function FeaturedCarousel({ onOpen }) {
  const feat = [
    { co: "Vektör Yazılım", color: "#6366f1", initials: "V", role: "Senior Frontend Engineer", tags: ["React", "TypeScript", "Next.js"], match: 92, salary: "₺85–115K", loc: "Remote" },
    { co: "Helix Health",   color: "#10b981", initials: "H", role: "React Native Developer",   tags: ["RN", "Expo", "TypeScript"],     match: 88, salary: "₺70–95K",  loc: "Hybrid · İstanbul" },
    { co: "Argon Labs",     color: "#f59e0b", initials: "A", role: "Full-stack Engineer",      tags: ["Node", "React", "Postgres"],    match: 84, salary: "₺95–130K", loc: "Remote" },
  ];
  return (
    <div className="qa-section">
      <div className="section-title">
        <span className="section-title__name"><Icon.Sparkles width="14" height="14" /> AI sana özel önerdi · 12 ilan</span>
        <a className="section-title__more" href="#">Tümü <Icon.Arrow /></a>
      </div>
      <div className="carousel">
        {feat.map((f, i) => (
          <div key={i} className="feat" onClick={onOpen}>
            <div className="feat__inner">
              <div className="feat__head">
                <div className="feat__logo" style={{ background: f.color }}>{f.initials}</div>
                <div>
                  <div className="feat__co">{f.co}</div>
                  <div className="feat__role">{f.role}</div>
                </div>
              </div>
              <span className="feat__match-pill"><Icon.Sparkles width="11" height="11" /> %{f.match} uyumlu · AI</span>
              <div className="feat__tags">{f.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
              <div className="feat__foot">
                <span>{f.loc}</span>
                <span>{f.salary}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Jobs list ----------
function JobsList({ onOpen }) {
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState("frontend");

  const chips = [
    { id: "all", label: "Tümü" },
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend" },
    { id: "fullstack", label: "Full-stack" },
    { id: "mobile", label: "Mobil" },
    { id: "remote", label: "Remote" },
    { id: "senior", label: "Senior" },
  ];

  const jobs = [
    { co: "Vektör Yazılım", color: "#6366f1", initials: "V", role: "Senior Frontend Engineer",  tags: ["React", "TypeScript", "Next.js", "TanStack"], match: 92, loc: "Remote",            sal: "₺85–115K", ago: "2 gün önce" },
    { co: "Helix Health",   color: "#10b981", initials: "H", role: "React Native Developer",    tags: ["RN", "Expo", "TypeScript"],                   match: 88, loc: "Hybrid · İstanbul", sal: "₺70–95K",  ago: "Bugün" },
    { co: "Argon Labs",     color: "#f59e0b", initials: "A", role: "Full-stack Engineer",       tags: ["Node.js", "React", "Postgres", "AWS"],        match: 84, loc: "Remote",            sal: "₺95–130K", ago: "4 gün önce" },
    { co: "Polari",         color: "#ef4444", initials: "P", role: "Frontend Lead",             tags: ["React", "Vue", "Mentorluk"],                  match: 78, loc: "Hybrid · Ankara",   sal: "₺120–160K",ago: "1 hafta önce" },
    { co: "Kineto",         color: "#06b6d4", initials: "K", role: "Senior React Engineer",     tags: ["React 19", "Suspense", "RSC"],                match: 86, loc: "Remote",            sal: "₺90–120K", ago: "3 gün önce" },
    { co: "Mercato",        color: "#8b5cf6", initials: "M", role: "Frontend Engineer",         tags: ["Vue", "Nuxt", "TypeScript"],                  match: 72, loc: "Remote",            sal: "₺55–80K",  ago: "5 gün önce" },
    { co: "Northwind",      color: "#ec4899", initials: "N", role: "UI Engineer · Design Sys",  tags: ["React", "Storybook", "CSS"],                  match: 81, loc: "Hybrid · İzmir",    sal: "₺75–100K", ago: "6 gün önce" },
    { co: "Quanta",         color: "#14b8a6", initials: "Q", role: "Senior Frontend (AI tools)",tags: ["React", "Streaming UI", "LLM"],               match: 90, loc: "Remote",            sal: "₺110–145K",ago: "1 gün önce", featured: true },
  ];

  return (
    <>
      <div className="filters">
        <div className="filters__row">
          <div className="filters__search">
            <span className="filters__search-icon"><Icon.Search width="16" height="16" /></span>
            <input placeholder="React, Node.js, Frontend Lead..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="filters__select" defaultValue="all">
            <option value="all">Tüm konumlar</option>
            <option>Remote</option>
            <option>İstanbul</option>
            <option>Ankara</option>
            <option>İzmir</option>
          </select>
          <select className="filters__select" defaultValue="all">
            <option value="all">Tüm deneyim</option>
            <option>Junior</option>
            <option>Mid</option>
            <option>Senior</option>
            <option>Lead</option>
          </select>
          <select className="filters__select" defaultValue="match">
            <option value="match">AI Uyumluluk</option>
            <option>En yeni</option>
            <option>Maaş (yüksek)</option>
          </select>
        </div>
        <div className="filters__chips">
          {chips.map(c => (
            <span key={c.id} className="chip" data-active={active === c.id} onClick={() => setActive(c.id)}>
              {c.label}
              {active === c.id && c.id !== "all" && <span className="chip__remove">✕</span>}
            </span>
          ))}
        </div>
      </div>

      <FeaturedCarousel onOpen={onOpen} />

      <div className="qa-section">
        <div className="section-title">
          <span className="section-title__name"><Icon.Briefcase width="14" height="14" /> Tüm ilanlar · 247 sonuç</span>
          <span className="section-title__more"><Icon.Activity width="13" height="13" /> Canlı güncelleniyor</span>
        </div>
        <div className="jobs-grid">
          {jobs.map((j, i) => (
            <div key={i} className="job-card" onClick={onOpen}>
              <div className="job-card__head">
                <div className="job-card__logo" style={{ background: j.color }}>{j.initials}</div>
                <div style={{ flex: 1 }}>
                  <div className="job-card__co">{j.co}</div>
                  <div className="job-card__role">{j.role}</div>
                </div>
                <MatchRing match={j.match} />
              </div>
              <div className="job-card__pills">
                <span className="pill"><Icon.MapPin /> {j.loc}</span>
                <span className="pill"><Icon.Cash /> {j.sal}</span>
                {j.featured && <span className="pill" style={{ color: "hsl(calc(218 + var(--ai-hue)) 92% 72%)" }}><Icon.Sparkles width="11" height="11" /> ÖNE ÇIKAN</span>}
              </div>
              <div className="job-card__tags">{j.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
              <div className="job-card__foot">
                <span>Yayınlandı · {j.ago}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Detaylar <Icon.Arrow /></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------- Job detail (apply) ----------
function JobDetail({ onBack }) {
  const [match, setMatch] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setMatch(92), 100);
    return () => clearTimeout(t);
  }, []);

  const reqSkills = [
    { name: "React",        have: true,  lvl: "ileri" },
    { name: "TypeScript",   have: true,  lvl: "ileri" },
    { name: "Next.js",      have: true,  lvl: "orta" },
    { name: "TanStack Query", have: true, lvl: "orta" },
    { name: "Cypress / Testing", have: false, lvl: "—" },
    { name: "GraphQL",      have: false, lvl: "—" },
  ];

  return (
    <>
      <span className="crumb" onClick={onBack}><Icon.Arrow /> İlanlara dön</span>

      <div className="detail-hero">
        <div className="detail-hero__logo" style={{ background: "#6366f1" }}>V</div>
        <div style={{ flex: 1 }}>
          <div className="detail-hero__co">Vektör Yazılım · vektor.com.tr · Yazılım & SaaS</div>
          <h1 className="detail-hero__role">Senior Frontend Engineer</h1>
          <div className="detail-hero__meta">
            <span className="pill"><Icon.MapPin /> Remote · Türkiye</span>
            <span className="pill"><Icon.Cash /> ₺85K – ₺115K · brüt</span>
            <span className="pill"><Icon.Activity width="11" height="11" /> Full-time</span>
            <span className="pill"><Icon.Sparkles width="11" height="11" /> 2 gün önce</span>
          </div>
          <div className="detail-hero__actions">
            <button className="btn btn--ghost btn--sm"><Icon.Bookmark /> Kaydet</button>
            <button className="btn btn--ghost btn--sm"><Icon.Share /> Paylaş</button>
          </div>
        </div>
      </div>

      <div className="detail-split">
        <div className="detail-body">
          <div className="card">
            <h3>Rol hakkında</h3>
            <p>Vektör, B2B SaaS müşterileri için yüksek-performans web ürünleri geliştiriyor. <b>Senior Frontend</b> rolünde, ürün ekibimizle birlikte yeni nesil platformumuzun arayüz mimarisinden sorumlu olacaksın. React 19 + Next.js + Server Components üzerine kurulu modern bir stack'le çalışıyoruz.</p>
            <p>Bu rolde günlük olarak ürün kararlarına dahil olacak, design system'i ileri taşıyacak ve junior mühendislere mentorluk yapacaksın.</p>
          </div>

          <div className="card">
            <h3>Sorumluluklar</h3>
            <ul>
              <li><Icon.Check /><div>Yeni ürün modüllerinin <b>uçtan uca</b> frontend geliştirmesi (React 19 + Server Components)</div></li>
              <li><Icon.Check /><div>Design system bileşenlerine yön vermek, <b>erişilebilirlik</b> kalitesini denetlemek</div></li>
              <li><Icon.Check /><div>Performans optimizasyonu — <b>Web Vitals</b> ve bundle analizi</div></li>
              <li><Icon.Check /><div>Code review kültürünü güçlendirmek, junior'lara mentorluk</div></li>
              <li><Icon.Check /><div>Ürün ve tasarım ekipleriyle birlikte teknik kararlar almak</div></li>
            </ul>
          </div>

          <div className="card">
            <h3>Aradığımız profil</h3>
            <ul>
              <li><Icon.Check /><div><b>5+ yıl</b> profesyonel frontend deneyimi</div></li>
              <li><Icon.Check /><div>React, TypeScript ve <b>Next.js App Router</b> ile production deneyimi</div></li>
              <li><Icon.Check /><div>Bileşen mimarisi, state management ve test stratejileri konusunda derin bilgi</div></li>
              <li><Icon.Check /><div>İletişimi güçlü, ürün düşünen, takım çalışmasını seven biri</div></li>
              <li><Icon.Check /><div>İngilizce dökümantasyon ve teknik yazışma rahat seviyede</div></li>
            </ul>
          </div>

          <div className="card">
            <h3>Tech stack</h3>
            <div className="tech-stack">
              {["React 19", "TypeScript", "Next.js 15", "TanStack Query", "Tailwind", "Zustand", "Vitest", "Playwright", "Storybook", "GitHub Actions", "Vercel"].map(t => (
                <span key={t} className="tech">{t}</span>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Sunduklarımız</h3>
            <ul>
              <li><Icon.Check /><div><b>%100 remote</b> · esnek çalışma saatleri</div></li>
              <li><Icon.Check /><div>Özel sağlık sigortası + dental</div></li>
              <li><Icon.Check /><div>Yıllık <b>₺25.000 eğitim bütçesi</b> + konferans</div></li>
              <li><Icon.Check /><div>Hisse seçeneği (vesting 4 yıl)</div></li>
              <li><Icon.Check /><div>Üst düzey ekipman · MacBook Pro M4 + aksesuarlar</div></li>
            </ul>
          </div>
        </div>

        <div className="apply-card">
          <div className="apply-card__inner">
            <div className="apply-card__body">
              <div className="apply-meter">
                <div className="apply-meter__ring">
                  <div className="apply-meter__ring-bg" style={{ "--m": match }}></div>
                  <div className="apply-meter__num">%{match}</div>
                </div>
                <div>
                  <div className="apply-meter__label">AI UYUMLULUK</div>
                  <div className="apply-meter__title">Güçlü eşleşme</div>
                  <div className="apply-meter__sub">Yetkinliklerin bu ilanın gereksinimleriyle iyi örtüşüyor.</div>
                </div>
              </div>

              <div className="skill-cmp">
                <div className="skill-cmp__head">
                  <span>İlan istiyor</span>
                  <span>Senin seviyen</span>
                </div>
                {reqSkills.map(s => (
                  <div key={s.name} className="skill-row">
                    <span className="skill-row__name">
                      <span className={`skill-row__check skill-row__check--${s.have ? "yes" : "no"}`}>
                        {s.have ? <Icon.Check width="10" height="10" /> : "—"}
                      </span>
                      {s.name}
                    </span>
                    <span className="skill-row__lvl">{s.lvl}</span>
                  </div>
                ))}
              </div>

              <div className="apply-actions">
                <button className="btn btn--ai btn--lg" style={{ width: "100%" }}>
                  <Icon.Sparkles /> Hemen başvur
                </button>
                <button className="btn btn--outline btn--sm" style={{ width: "100%" }}>
                  <Icon.Brain width="13" height="13" /> AI ile öne çıkar
                </button>
                <div className="mono-sm" style={{ textAlign: "center", marginTop: 4, color: "var(--text-muted)" }}>
                  47 başvuru · 12 yüksek skor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- Profile ----------
function Profile() {
  const [pct, setPct] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setPct(76), 200); return () => clearTimeout(t); }, []);

  const completion = [
    { label: "Temel bilgiler", done: true },
    { label: "Profil fotoğrafı", done: true },
    { label: "Hakkımda metni", done: true },
    { label: "İş deneyimi (CV)", done: true },
    { label: "Sosyal linkler", done: false },
    { label: "GitHub bağla", done: false },
    { label: "Beceri etiketleri ekle", done: false },
  ];

  return (
    <>
      <div className="profile-cover" />
      <div className="profile-header">
        <div className="profile-avatar">
          AY
          <span className="profile-avatar__edit"><Icon.Upload width="14" height="14" /></span>
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="profile-name">Ahmet K. Yılmaz</h1>
          <div className="profile-headline">
            <span>Senior Frontend Engineer · 6 yıl</span>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon.MapPin /> İstanbul, Türkiye
            </span>
            <span className="feat__match-pill" style={{ fontSize: 10.5 }}>
              <Icon.Sparkles width="11" height="11" /> AI doğrulandı · 87
            </span>
          </div>
        </div>
        <button className="btn btn--ai btn--sm"><Icon.Check width="14" height="14" /> Kaydet</button>
      </div>

      <div className="profile-split">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="section-title">
              <span className="section-title__name"><Icon.User width="14" height="14" /> Kişisel bilgiler</span>
            </div>
            <div className="form-section">
              <div className="form-row">
                <div className="field">
                  <label>Ad</label>
                  <input defaultValue="Ahmet K." />
                </div>
                <div className="field">
                  <label>Soyad</label>
                  <input defaultValue="Yılmaz" />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>E-posta</label>
                  <input defaultValue="ahmet@example.com" />
                </div>
                <div className="field">
                  <label>Telefon</label>
                  <input defaultValue="+90 555 123 45 67" />
                </div>
              </div>
              <div className="form-row form-row--single">
                <div className="field">
                  <label>Başlık</label>
                  <input defaultValue="Senior Frontend Engineer" />
                  <span className="field__hint">Profilinin ilk gördüğü satır — kısa ve net olsun.</span>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Konum</label>
                  <input defaultValue="İstanbul, Türkiye" />
                </div>
                <div className="field">
                  <label>Deneyim</label>
                  <select defaultValue="6">
                    <option value="0">0–1 yıl</option><option value="2">2–3 yıl</option>
                    <option value="4">4–5 yıl</option><option value="6">6–8 yıl</option>
                    <option value="9">9+ yıl</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">
              <span className="section-title__name"><Icon.FileText width="14" height="14" /> Hakkımda</span>
              <span className="section-title__more"><Icon.Sparkles width="13" height="13" /> AI ile yaz</span>
            </div>
            <div className="field">
              <label>Kısa biyografi</label>
              <textarea defaultValue="6 yıllık frontend deneyimimle, modern React stack'iyle ölçeklenebilir ürünler geliştiriyorum. Performans, erişilebilirlik ve takım kültürüne önem veriyorum. Son 2 yıldır Next.js + Server Components üzerine derinleşiyorum." />
              <span className="field__hint">142/500 karakter</span>
            </div>
          </div>

          <div className="card">
            <div className="section-title">
              <span className="section-title__name"><Icon.Link width="14" height="14" /> Sosyal linkler</span>
            </div>
            <div className="social-row">
              <div className="social-row__icon"><Icon.Github width="18" height="18" /></div>
              <input defaultValue="github.com/ahmetky" />
              <span className="social-row__verified"><Icon.Check width="11" height="11" /> DOĞRULANDI</span>
            </div>
            <div className="social-row">
              <div className="social-row__icon"><Icon.Link width="16" height="16" /></div>
              <input defaultValue="linkedin.com/in/ahmetky" />
              <span className="mono-sm" style={{ color: "var(--text-muted)" }}>opsiyonel</span>
            </div>
            <div className="social-row">
              <div className="social-row__icon"><Icon.Link width="16" height="16" /></div>
              <input placeholder="Kişisel websiten / portfolyo" />
              <span className="mono-sm" style={{ color: "var(--text-muted)" }}>opsiyonel</span>
            </div>
            <div className="social-row">
              <div className="social-row__icon"><Icon.Link width="16" height="16" /></div>
              <input placeholder="X / Twitter kullanıcı adı" />
              <span className="mono-sm" style={{ color: "var(--text-muted)" }}>opsiyonel</span>
            </div>
          </div>

          <div className="card">
            <div className="section-title">
              <span className="section-title__name"><Icon.Brain width="14" height="14" /> Beceriler</span>
              <span className="section-title__more"><Icon.Sparkles width="13" height="13" /> CV'den çek</span>
            </div>
            <div className="tech-stack">
              {["React", "TypeScript", "Next.js", "Node.js", "TanStack Query", "Zustand", "Tailwind", "Vitest", "Playwright", "+ Ekle"].map((t, i) => (
                <span key={t} className="tech" style={i === 9 ? { borderStyle: "dashed", cursor: "pointer", color: "var(--text-muted)" } : null}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 20 }}>
          <div className="completion">
            <div className="completion__inner">
              <div className="mono-sm" style={{ color: "var(--text-muted)", marginBottom: 4 }}>PROFİL TAMAMLANMA</div>
              <div className="completion__num">%{pct}</div>
              <div className="completion__bar">
                <div className="completion__bar-fill" style={{ "--p": `${pct}%` }} />
              </div>
              <div className="completion__list">
                {completion.map((c, i) => (
                  <div key={i} className={`completion__item ${c.done ? "completion__item--done" : ""}`}>
                    <span className="completion__check">{c.done && <Icon.Check width="9" height="9" />}</span>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">
              <span className="section-title__name"><Icon.Github width="14" height="14" /> GitHub durumu</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Hesap</span>
                <span style={{ fontFamily: "Geist Mono, monospace" }}>@ahmetky</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Public repo</span>
                <span style={{ fontFamily: "Geist Mono, monospace" }}>32</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Son 1 yıl katkı</span>
                <span style={{ fontFamily: "Geist Mono, monospace" }}>847</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Doğrulama</span>
                <span className="social-row__verified"><Icon.Check width="11" height="11" /> DOĞRULANDI</span>
              </div>
            </div>
            <button className="btn btn--outline btn--sm" style={{ width: "100%", marginTop: 14 }}>
              <Icon.Refresh /> Yeniden senkronize et
            </button>
          </div>

          <div className="card">
            <div className="section-title">
              <span className="section-title__name"><Icon.User width="14" height="14" /> Profil görünürlüğü</span>
            </div>
            <div className="field">
              <label>Görünürlük</label>
              <select defaultValue="public">
                <option value="public">Tüm şirketlere açık</option>
                <option value="opted">Sadece başvurduğum şirketlere</option>
                <option value="hidden">Gizli</option>
              </select>
              <span className="field__hint">Şirketler senin profilini AI sıralamada görebilir.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- App ----------
function App() {
  const [t, setTweak] = useTweaks(JOBS_TWEAKS);

  React.useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.style.setProperty("--ai-intensity", t.aiIntensity);
    document.documentElement.style.setProperty("--ai-hue", t.aiHue);
  }, [t.theme, t.aiIntensity, t.aiHue]);

  const setTheme = (v) => setTweak("theme", v);

  const activeSidebar = t.page === "profile" ? "profile" : "jobs";

  const crumb = {
    list:    { tag: "İLAN ARAMA",    title: "İlanlar" },
    detail:  { tag: "İLAN DETAYI",   title: "İlan detayı" },
    profile: { tag: "PROFİLİM",      title: "Profili düzenle" },
  }[t.page];

  return (
    <div className="app">
      <UserSidebar active={activeSidebar} theme={t.theme} setTheme={setTheme} />
      <div>
        <div className="mobile-bar">
          <div className="sidebar__brand" style={{ margin: 0 }}>
            <span className="sidebar__brand-mark"><Icon.Logo /></span>
            Synapse
          </div>
          <div className="row">
            <ThemeToggle theme={t.theme} setTheme={setTheme} />
            <button className="icon-btn"><Icon.Menu width="18" height="18" /></button>
          </div>
        </div>
        <main className="main">
          <div className="page-head">
            <div>
              <div className="page-head__crumbs">{crumb.tag}</div>
            </div>
            <div className="page-head__actions">
              <div className="page-toggle">
                <button data-active={t.page === "list"}    onClick={() => setTweak("page", "list")}>
                  <Icon.Briefcase width="13" height="13" /> İlanlar
                </button>
                <button data-active={t.page === "detail"}  onClick={() => setTweak("page", "detail")}>
                  <Icon.FileText width="13" height="13" /> Detay
                </button>
                <button data-active={t.page === "profile"} onClick={() => setTweak("page", "profile")}>
                  <Icon.User width="13" height="13" /> Profil
                </button>
              </div>
            </div>
          </div>

          {t.page === "list"   && <JobsList onOpen={() => setTweak("page", "detail")} />}
          {t.page === "detail" && <JobDetail onBack={() => setTweak("page", "list")} />}
          {t.page === "profile" && <Profile />}
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Sayfa" />
        <TweakSelect
          label="Görünen"
          value={t.page}
          options={[
            { value: "list",    label: "İlanlar (liste)" },
            { value: "detail",  label: "İlan detayı + başvuru" },
            { value: "profile", label: "Profil düzenle" },
          ]}
          onChange={(v) => setTweak("page", v)}
        />
        <TweakSection label="Tema" />
        <TweakRadio label="Mod" value={t.theme} options={["dark", "light"]} onChange={(v) => setTweak("theme", v)} />
        <TweakSection label="AI Vurgusu" />
        <TweakSlider label="Yoğunluk" value={t.aiIntensity} min={0.2} max={1.2} step={0.05} onChange={(v) => setTweak("aiIntensity", v)} />
        <TweakSlider label="Renk tonu" value={t.aiHue} min={-60} max={120} step={5} unit="°" onChange={(v) => setTweak("aiHue", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
