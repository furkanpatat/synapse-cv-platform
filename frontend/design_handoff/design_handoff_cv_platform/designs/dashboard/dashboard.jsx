/* ============================================================
   Dashboard — USER + COMPANY home with role toggle
   ============================================================ */

const DASH_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "aiIntensity": 0.7,
  "aiHue": 0,
  "role": "user"
}/*EDITMODE-END*/;

// ---------- Sidebars (role aware) ----------
function DashSidebar({ role, theme, setTheme }) {
  const userItems = [
    { icon: <Icon.Home className="sidebar__icon" />,      label: "Panel",        active: true },
    { icon: <Icon.FileText className="sidebar__icon" />,  label: "CV'm" },
    { icon: <Icon.Brain className="sidebar__icon" />,     label: "AI Analiz", badge: "AI" },
    { icon: <Icon.Briefcase className="sidebar__icon" />, label: "İlanlar" },
    { icon: <Icon.Inbox className="sidebar__icon" />,     label: "Başvurularım", count: 8 },
    { icon: <Icon.Message className="sidebar__icon" />,   label: "Mesajlar", count: 3 },
  ];
  const companyItems = [
    { icon: <Icon.Home className="sidebar__icon" />,      label: "Panel",        active: true },
    { icon: <Icon.Briefcase className="sidebar__icon" />, label: "İlanlarım", count: 4 },
    { icon: <Icon.Inbox className="sidebar__icon" />,     label: "Başvurular", count: 47 },
    { icon: <Icon.Brain className="sidebar__icon" />,     label: "AI Sıralama", badge: "AI" },
    { icon: <Icon.Message className="sidebar__icon" />,   label: "Mesajlar", count: 12 },
    { icon: <Icon.Activity className="sidebar__icon" />,  label: "İstatistikler" },
  ];
  const items = role === "user" ? userItems : companyItems;
  const account = role === "user"
    ? [
        { icon: <Icon.User className="sidebar__icon" />,  label: "Profil" },
        { icon: <Icon.Crown className="sidebar__icon" />, label: "Abonelik" },
      ]
    : [
        { icon: <Icon.User className="sidebar__icon" />,  label: "Şirket Profili" },
        { icon: <Icon.Crown className="sidebar__icon" />, label: "Faturalama" },
      ];

  const renderItem = (it, i) => (
    <a key={i} className={`sidebar__item ${it.active ? "sidebar__item--active" : ""}`}>
      {it.icon}<span>{it.label}</span>
      {it.badge && <span className="sidebar__badge sidebar__badge--ai">{it.badge}</span>}
      {it.count != null && <span className="sidebar__badge">{it.count}</span>}
    </a>
  );

  const ws = role === "user" ? "Çalışma alanı" : "Yönetim";
  const userMeta = role === "user"
    ? { initials: "AY", name: "A. K. Yılmaz", plan: "FREE · 1/3 kullanım", grad: "linear-gradient(135deg, #f59e0b, #ef4444)" }
    : { initials: "VY", name: "Vektör Yazılım", plan: "BUSINESS · ₺1.499/ay", grad: "linear-gradient(135deg, #6366f1, #06b6d4)" };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark"><Icon.Logo /></span>
        Synapse
      </div>
      <div className="sidebar__section">{ws}</div>
      <nav className="sidebar__nav">{items.map(renderItem)}</nav>
      <div className="sidebar__section">Hesap</div>
      <nav className="sidebar__nav">{account.map(renderItem)}</nav>
      <div className="sidebar__footer">
        <div className="row" style={{ marginBottom: 10, paddingLeft: 6 }}>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <span className="mono-sm">{theme === "dark" ? "Karanlık" : "Aydınlık"}</span>
        </div>
        <div className="sidebar__user">
          <div className="sidebar__avatar" style={{ background: userMeta.grad }}>{userMeta.initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{userMeta.name}</div>
            <div className="sidebar__user-plan">{userMeta.plan}</div>
          </div>
          <Icon.Chevron className="sidebar__icon" style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    </aside>
  );
}

// ---------- USER quick actions ----------
function UserQuickActions() {
  const actions = [
    { icon: <Icon.FileText />,  title: "CV'm", sub: "Yapılandırılmış veri + skor", badge: "AYRIŞTIRILDI", badgeT: "success", foot: "Son güncel · 3 gün önce", ai: false },
    { icon: <Icon.Brain />,     title: "AI Analiz", sub: "Yetkinliklerini doğrulat", badge: "87/100", badgeT: "ai", foot: "Skor güncel", ai: true },
    { icon: <Icon.Briefcase />, title: "İlanlar", sub: "Sana uygun 24 yeni rol", badge: "+12", badgeT: "warning", foot: "%82 ort. uyumluluk" },
    { icon: <Icon.Inbox />,     title: "Başvurularım", sub: "Aktif 8, sonuçlanan 4", badge: "2 yeni", badgeT: "warning", foot: "1 görüşme planlandı" },
    { icon: <Icon.Message />,   title: "Mesajlar", sub: "İşveren konuşmaları", badge: "3", badgeT: "ai", foot: "Vektör · 2 saat önce" },
    { icon: <Icon.User />,      title: "Profil", sub: "Sosyal linkler ve avatar", badge: "TAMAMLA", badgeT: "warning", foot: "%76 tamamlandı" },
  ];
  return (
    <div className="qa-grid">
      {actions.map((a, i) => (
        <div key={i} className={`qa ${a.ai ? "qa--ai" : ""}`}>
          <div className="qa__icon">{a.icon}</div>
          <div className="qa__title">{a.title}</div>
          <div className="qa__sub">{a.sub}</div>
          <div className="qa__foot">
            <span>{a.foot}</span>
            <span className={`qa__badge qa__badge--${a.badgeT}`}>{a.badge}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Score Widget ----------
function ScoreWidget() {
  const [score, setScore] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setScore(87), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="score-widget">
      <div className="score-widget__inner">
        <div className="score-widget__head">
          <span className="score-widget__title"><Icon.Sparkles width="12" height="12" /> SON AI SKORU</span>
          <span className="score-widget__delta"><Icon.Arrow /> +4</span>
        </div>
        <div className="score-widget__body">
          <div className="score-widget__ring">
            <div className="score-widget__ring-bg" style={{ "--score": score }}></div>
            <div className="score-widget__ring-num">{score}</div>
          </div>
          <div>
            <div className="score-widget__name">Senior Frontend</div>
            <div style={{ fontSize: 13, color: "var(--text)", marginTop: 4, lineHeight: 1.45 }}>
              Yetkinliklerin <b>kanıta dayalı</b> olarak doğrulandı.
            </div>
          </div>
        </div>
        <div className="score-widget__breakdown">
          <div>Yetkinlik <b>91</b></div>
          <div>GitHub <b>84</b></div>
          <div>Tutarlılık <b>86</b></div>
          <div>Güven <b>%92</b></div>
        </div>
        <div className="score-widget__cta">
          <button className="btn btn--ai btn--sm" style={{ width: "100%" }}>
            <Icon.Sparkles width="13" height="13" /> Raporu aç
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- USER Suggested jobs ----------
function SuggestedJobs() {
  const jobs = [
    { co: "Vektör Yazılım", color: "#6366f1", initials: "V",  role: "Senior Frontend Engineer", meta: "Remote · ₺85–115K · 2 gün önce", match: 92 },
    { co: "Helix Health",   color: "#10b981", initials: "H",  role: "React Native Developer",   meta: "İstanbul · Hybrid · Bugün",      match: 84 },
    { co: "Argon Labs",     color: "#f59e0b", initials: "A",  role: "Full-stack Engineer",      meta: "Remote · ₺95–130K · 4 gün önce", match: 78 },
    { co: "Polari",         color: "#ef4444", initials: "P",  role: "Frontend Lead",            meta: "Ankara · Hybrid · 1 hafta önce", match: 71 },
  ];
  return (
    <div className="card">
      <div className="section-title">
        <span className="section-title__name"><Icon.Sparkles width="14" height="14" /> Sana önerilen ilanlar</span>
        <a className="section-title__more" href="#">Tümünü gör <Icon.Arrow /></a>
      </div>
      <div className="job-list">
        {jobs.map((j, i) => (
          <div key={i} className="job">
            <div className="job__logo" style={{ background: j.color }}>{j.initials}</div>
            <div>
              <div className="job__name">{j.role}</div>
              <div className="job__meta">{j.co} · {j.meta}</div>
            </div>
            <div className="job__match">
              <div className="job__match-ring" style={{ "--m": j.match }}></div>
              <div className="job__match-num">%{j.match}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- USER Recent applications timeline ----------
function ApplicationsTimeline() {
  const apps = [
    { title: "Senior Frontend · Vektör Yazılım", meta: "Başvuru · 2 saat önce", status: "review",   label: "İncelemede" },
    { title: "React Native · Helix Health",     meta: "Mülakat · Yarın 14:00", status: "accepted", label: "Görüşme" },
    { title: "Full-stack · Argon Labs",         meta: "Başvuru · 3 gün önce",  status: "pending",  label: "Bekliyor" },
    { title: "Frontend Lead · Polari",          meta: "Geri dönüş · 1 hafta önce", status: "rejected", label: "Olumsuz" },
  ];
  return (
    <div className="card">
      <div className="section-title">
        <span className="section-title__name"><Icon.Inbox width="14" height="14" /> Son başvurular</span>
        <a className="section-title__more" href="#">Tümünü gör <Icon.Arrow /></a>
      </div>
      <div className="timeline">
        {apps.map((a, i) => (
          <div key={i} className="tl">
            <div className={`tl__dot tl__dot--${a.status}`}></div>
            <div>
              <div className="tl__title">{a.title}</div>
              <div className="tl__meta">{a.meta}</div>
            </div>
            <span className={`tl__status tl__status--${a.status}`}>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- USER Dashboard ----------
function UserDashboard() {
  return (
    <>
      <div className="hello">
        <div className="hello__card">
          <div className="hello__eyebrow"><Icon.Sparkles width="12" height="12" /> SALI · 12 MAYIS</div>
          <h1 className="hello__title">Merhaba <span className="ai-text">Ahmet</span>, bugün 12 yeni uygun ilan var.</h1>
          <p className="hello__sub">AI skorun son haftada <b style={{ color: "var(--text)" }}>+4 puan</b> arttı. CV'ni güncellersen %92 uyumlulukla yeni rolleri yakalayabilirsin.</p>
          <div className="hello__actions">
            <button className="btn btn--ai btn--lg"><Icon.Sparkles /> Yeni analiz</button>
            <button className="btn btn--outline btn--lg"><Icon.Briefcase width="14" height="14" /> İlanlara göz at</button>
          </div>
        </div>
        <ScoreWidget />
      </div>

      <div className="qa-section">
        <div className="section-title">
          <span className="section-title__name"><Icon.Target width="14" height="14" /> Hızlı işlemler</span>
        </div>
        <UserQuickActions />
      </div>

      <div className="split">
        <SuggestedJobs />
        <ApplicationsTimeline />
      </div>
    </>
  );
}

// ---------- COMPANY stats ----------
function CompanyStats() {
  const stats = [
    { label: "Aktif ilan",      num: 4,   delta: "+1 bu hafta",      up: true,  icon: <Icon.Briefcase width="14" height="14" /> },
    { label: "Toplam başvuru",  num: 247, delta: "+47 bu hafta",     up: true,  icon: <Icon.Inbox width="14" height="14" /> },
    { label: "Yüksek AI skor",  num: 31,  delta: "85+ skor",         up: true,  icon: <Icon.Sparkles width="14" height="14" /> },
    { label: "Görüntülenme",    num: "8.4K", delta: "+18% geçen aya", up: true,  icon: <Icon.Activity width="14" height="14" /> },
  ];
  // tiny sparkline as svg
  const spark = (color) => (
    <svg className="stat__spark" viewBox="0 0 80 28" preserveAspectRatio="none">
      <path d="M0 22 L10 18 L20 20 L30 12 L40 14 L50 8 L60 10 L70 4 L80 6" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M0 22 L10 18 L20 20 L30 12 L40 14 L50 8 L60 10 L70 4 L80 6 L80 28 L0 28 Z" fill={color} opacity="0.12" />
    </svg>
  );
  return (
    <div className="stats-grid">
      {stats.map((s, i) => (
        <div key={i} className="stat">
          <div className="stat__head">
            <span className="stat__label">{s.label}</span>
            <span className="stat__icon">{s.icon}</span>
          </div>
          <div className="stat__num">{s.num}</div>
          <div className={`stat__delta ${s.up ? "stat__delta--up" : "stat__delta--down"}`}>
            <Icon.Arrow style={{ transform: s.up ? "rotate(-45deg)" : "rotate(45deg)" }} />
            {s.delta}
          </div>
          {spark(s.up ? "#34d399" : "#f87171")}
        </div>
      ))}
    </div>
  );
}

// ---------- COMPANY top candidates ----------
function TopCandidates() {
  const cands = [
    { initials: "AY", name: "A. K. Yılmaz",   role: "Senior Frontend · 6yr",     score: 92, grad: "linear-gradient(135deg, #f59e0b, #ef4444)" },
    { initials: "MŞ", name: "M. Şahin",       role: "Full-stack · 4yr",          score: 88, grad: "linear-gradient(135deg, #6366f1, #06b6d4)" },
    { initials: "EÖ", name: "E. Özer",        role: "React Native · 3yr",        score: 84, grad: "linear-gradient(135deg, #10b981, #84cc16)" },
    { initials: "BD", name: "B. Demir",       role: "Frontend Engineer · 5yr",   score: 79, grad: "linear-gradient(135deg, #a855f7, #ec4899)" },
    { initials: "ZA", name: "Z. Aksoy",       role: "Frontend Engineer · 2yr",   score: 64, grad: "linear-gradient(135deg, #64748b, #94a3b8)" },
  ];
  return (
    <div className="card">
      <div className="section-title">
        <span className="section-title__name"><Icon.Sparkles width="14" height="14" /> AI sıralı en iyi adaylar</span>
        <a className="section-title__more" href="#">Tüm başvurular <Icon.Arrow /></a>
      </div>
      <div className="cand-list">
        {cands.map((c, i) => (
          <div key={i} className="cand">
            <div className="cand__avatar" style={{ background: c.grad }}>{c.initials}</div>
            <div>
              <div className="cand__name">{c.name}</div>
              <div className="cand__role">{c.role}</div>
            </div>
            <span className="mono-sm" style={{ color: "var(--text-2)" }}>Senior Frontend</span>
            <span className={`cand__score ${c.score < 70 ? "cand__score--mid" : ""}`}>{c.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- COMPANY active jobs ----------
function ActiveJobs() {
  const jobs = [
    { name: "Senior Frontend Engineer", meta: "Remote · 2 gün önce yayında",   apps: 67, live: true },
    { name: "Backend Engineer (Go)",    meta: "İstanbul · 1 hafta önce",       apps: 84, live: true },
    { name: "Product Designer",         meta: "Hybrid · 3 gün önce",           apps: 42, live: true },
    { name: "DevOps Engineer",          meta: "Remote · taslak",               apps: 0,  live: false },
  ];
  return (
    <div className="card">
      <div className="section-title">
        <span className="section-title__name"><Icon.Briefcase width="14" height="14" /> Aktif ilanlar</span>
        <button className="btn btn--ai btn--sm"><Icon.Sparkles width="13" height="13" /> Yeni ilan</button>
      </div>
      <div>
        {jobs.map((j, i) => (
          <div key={i} className="job-row">
            <div>
              <div className="job-row__name">{j.name}</div>
              <div className="job-row__meta">{j.meta}</div>
            </div>
            <span className={`job-row__pill ${j.live ? "job-row__pill--live" : ""}`}>
              {j.live ? "YAYINDA" : "TASLAK"}
            </span>
            <span className="job-row__apps">{j.apps} başvuru</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- COMPANY activity feed ----------
function ActivityFeed() {
  const items = [
    { icon: <Icon.Inbox width="14" height="14" />,    body: <><b>3 yeni başvuru</b> · Senior Frontend Engineer</>, time: "5 dk" },
    { icon: <Icon.Sparkles width="14" height="14" />, body: <><b>AI raporu hazır</b> · M. Şahin · Skor 88</>,       time: "1 sa" },
    { icon: <Icon.Message width="14" height="14" />,  body: <><b>Mesaj</b> · A. K. Yılmaz görüşmeyi onayladı</>,    time: "2 sa" },
    { icon: <Icon.Briefcase width="14" height="14" />,body: <><b>İlan yayınlandı</b> · Backend Engineer (Go)</>,    time: "1 gün" },
    { icon: <Icon.Activity width="14" height="14" />, body: <><b>Görüntülenme +18%</b> · son 7 gün</>,              time: "1 gün" },
  ];
  return (
    <div className="card">
      <div className="section-title">
        <span className="section-title__name"><Icon.Activity width="14" height="14" /> Son aktiviteler</span>
      </div>
      <div className="feed">
        {items.map((it, i) => (
          <div key={i} className="feed__item">
            <div className="feed__icon">{it.icon}</div>
            <div className="feed__body">{it.body}</div>
            <div className="feed__time">{it.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- COMPANY Dashboard ----------
function CompanyDashboard() {
  return (
    <>
      <div className="hello">
        <div className="hello__card">
          <div className="hello__eyebrow"><Icon.Sparkles width="12" height="12" /> SALI · 12 MAYIS</div>
          <h1 className="hello__title">Merhaba <span className="ai-text">Vektör</span>, bu hafta 47 yeni başvuru var.</h1>
          <p className="hello__sub">Senior Frontend ilanın için AI <b style={{ color: "var(--text)" }}>3 güçlü aday</b> öne çıkardı. Mülakat planlamak için tıkla.</p>
          <div className="hello__actions">
            <button className="btn btn--ai btn--lg"><Icon.Sparkles /> Yeni ilan oluştur</button>
            <button className="btn btn--outline btn--lg"><Icon.Inbox width="14" height="14" /> Başvuruları gör</button>
          </div>
        </div>
        <div className="score-widget">
          <div className="score-widget__inner">
            <div className="score-widget__head">
              <span className="score-widget__title"><Icon.Sparkles width="12" height="12" /> İLAN HAVUZU SAĞLIĞI</span>
              <span className="score-widget__delta"><Icon.Arrow /> +8</span>
            </div>
            <div className="score-widget__body">
              <div className="score-widget__ring">
                <div className="score-widget__ring-bg" style={{ "--score": 78 }}></div>
                <div className="score-widget__ring-num">78</div>
              </div>
              <div>
                <div className="score-widget__name">4 aktif ilan</div>
                <div style={{ fontSize: 13, color: "var(--text)", marginTop: 4, lineHeight: 1.45 }}>
                  Aday <b>kalite skoru</b> sektör ortalamasının üstünde.
                </div>
              </div>
            </div>
            <div className="score-widget__breakdown">
              <div>Aday kalitesi <b>82</b></div>
              <div>Yanıt oranı <b>%64</b></div>
              <div>İlan süresi <b>11g</b></div>
              <div>Time-to-hire <b>21g</b></div>
            </div>
            <div className="score-widget__cta">
              <button className="btn btn--outline btn--sm" style={{ width: "100%" }}>
                <Icon.Activity width="13" height="13" /> Raporu aç
              </button>
            </div>
          </div>
        </div>
      </div>

      <CompanyStats />

      <div className="split">
        <ActiveJobs />
        <TopCandidates />
      </div>

      <div style={{ marginTop: 16 }}>
        <ActivityFeed />
      </div>
    </>
  );
}

// ---------- App ----------
function App() {
  const [t, setTweak] = useTweaks(DASH_TWEAKS);

  React.useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.style.setProperty("--ai-intensity", t.aiIntensity);
    document.documentElement.style.setProperty("--ai-hue", t.aiHue);
  }, [t.theme, t.aiIntensity, t.aiHue]);

  const setTheme = (v) => setTweak("theme", v);

  return (
    <div className="app">
      <DashSidebar role={t.role} theme={t.theme} setTheme={setTheme} />
      <div>
        <MobileBarLocal theme={t.theme} setTheme={setTheme} />
        <main className="main">
          <div className="page-head">
            <div>
              <div className="page-head__crumbs">{t.role === "user" ? "USER PANEL" : "COMPANY PANEL"}</div>
              <h1 className="page-head__title" style={{ display: "none" }}>Panel</h1>
            </div>
            <div className="page-head__actions">
              <div className="role-toggle" title="Rol değiştir">
                <button data-active={t.role === "user"}    onClick={() => setTweak("role", "user")}>
                  <Icon.User width="13" height="13" /> Birey
                </button>
                <button data-active={t.role === "company"} onClick={() => setTweak("role", "company")}>
                  <Icon.Briefcase width="13" height="13" /> Şirket
                </button>
              </div>
            </div>
          </div>

          {t.role === "user" ? <UserDashboard /> : <CompanyDashboard />}
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Rol" />
        <TweakRadio
          label="Panel"
          value={t.role}
          options={["user", "company"]}
          onChange={(v) => setTweak("role", v)}
        />
        <TweakSection label="Tema" />
        <TweakRadio
          label="Mod"
          value={t.theme}
          options={["dark", "light"]}
          onChange={(v) => setTweak("theme", v)}
        />
        <TweakSection label="AI Vurgusu" />
        <TweakSlider
          label="Yoğunluk"
          value={t.aiIntensity}
          min={0.2} max={1.2} step={0.05}
          onChange={(v) => setTweak("aiIntensity", v)}
        />
        <TweakSlider
          label="Renk tonu"
          value={t.aiHue}
          min={-60} max={120} step={5}
          unit="°"
          onChange={(v) => setTweak("aiHue", v)}
        />
      </TweaksPanel>
    </div>
  );
}

function MobileBarLocal({ theme, setTheme }) {
  return (
    <div className="mobile-bar">
      <div className="sidebar__brand" style={{ margin: 0 }}>
        <span className="sidebar__brand-mark"><Icon.Logo /></span>
        Synapse
      </div>
      <div className="row">
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button className="icon-btn"><Icon.Menu width="18" height="18" /></button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
