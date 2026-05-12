/* ============================================================
   Billing / Subscription page
   ============================================================ */

// Extra icons used here
Object.assign(Icon, {
  Receipt: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 2zM8 7h8M8 11h8M8 15h6"/>
    </svg>
  ),
  Card: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>
    </svg>
  ),
  Bolt: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M13 2 3 14h8l-1 8 10-12h-8z"/>
    </svg>
  ),
  Plus: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  X: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6 6 18"/>
    </svg>
  ),
});

const BILLING_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "aiIntensity": 0.7,
  "aiHue": 0,
  "billed": "monthly",
  "currentPlan": "free"
}/*EDITMODE-END*/;

// ---------- Sidebar (Abonelik active) ----------
function UserSidebar({ theme, setTheme }) {
  const items = [
    { icon: <Icon.Home className="sidebar__icon" />, label: "Panel" },
    { icon: <Icon.FileText className="sidebar__icon" />, label: "CV'm" },
    { icon: <Icon.Brain className="sidebar__icon" />, label: "AI Analiz", badge: "AI" },
    { icon: <Icon.Briefcase className="sidebar__icon" />, label: "İlanlar" },
    { icon: <Icon.Inbox className="sidebar__icon" />, label: "Başvurularım", count: 8 },
    { icon: <Icon.Message className="sidebar__icon" />, label: "Mesajlar", count: 3 },
  ];
  const account = [
    { icon: <Icon.User className="sidebar__icon" />, label: "Profil" },
    { icon: <Icon.Crown className="sidebar__icon" />, label: "Abonelik", active: true },
  ];
  const item = (it, i) => (
    <a key={i} className={`sidebar__item ${it.active ? "sidebar__item--active" : ""}`}>
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

// ---------- Current plan hero ----------
function PlanHero({ current }) {
  const isPremium = current === "premium";
  return (
    <div className="plan-hero">
      <div className="plan-card">
        <span className={`plan-badge ${isPremium ? "plan-badge--premium" : "plan-badge--free"}`}>
          {isPremium ? <Icon.Sparkles width="11" height="11" /> : <Icon.User width="11" height="11" />}
          {isPremium ? "PREMIUM" : "FREE PLAN"}
        </span>
        <h1 className="plan-card__name">
          {isPremium
            ? <>Synapse <span className="ai-text">Premium</span></>
            : <>Synapse Free</>}
        </h1>
        <p className="plan-card__sub">
          {isPremium
            ? "Tüm AI özellikleri, sınırsız analiz ve öncelikli destek senin emrinde. Her gün daha doğru eşleşmeler."
            : "Temel özelliklerle başla, AI analizini ayda 3 kez ücretsiz kullan. Premium'a yükselt, sınırları kaldır."}
        </p>
        <div className="plan-card__row">
          {isPremium ? (
            <>
              <button className="btn btn--outline btn--lg"><Icon.Card /> Ödeme yöntemini düzenle</button>
              <button className="btn btn--ghost btn--sm">Aboneliği iptal et</button>
            </>
          ) : (
            <>
              <button className="btn btn--ai btn--lg btn--pulse">
                <Icon.Sparkles /> Premium'a yükselt
              </button>
              <button className="btn btn--outline btn--sm"><Icon.Receipt /> Kullanım geçmişi</button>
            </>
          )}
        </div>
      </div>

      <div className="next-bill">
        <div className="next-bill__row">
          <span className="next-bill__label">{isPremium ? "Sonraki Fatura" : "Mevcut Limit"}</span>
          <span className="next-bill__val" style={{ fontFamily: "Geist Mono, monospace" }}>
            {isPremium ? "₺199,00" : "—"}
          </span>
        </div>
        <div className="next-bill__row">
          <span className="next-bill__label">{isPremium ? "Yenileme" : "Reset"}</span>
          <span className="next-bill__val">{isPremium ? "12 Haz 2026" : "1 Haz 2026"}</span>
        </div>
        <div className="next-bill__row">
          <span className="next-bill__label">{isPremium ? "Ödeme" : "Plan"}</span>
          <span className="next-bill__val" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {isPremium ? (
              <><Icon.Card /> •••• 4242</>
            ) : (
              <>Ücretsiz</>
            )}
          </span>
        </div>
        <div className="next-bill__row">
          <span className="next-bill__label">Aktiflik</span>
          <span className="next-bill__val" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isPremium ? "#34d399" : "#fbbf24", boxShadow: isPremium ? "0 0 8px #34d399" : "0 0 8px #fbbf24" }} />
            {isPremium ? "Aktif" : "Kısıtlı"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- Usage bars ----------
function Usage({ current }) {
  const isPremium = current === "premium";
  const [a, setA] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setA(1), 100); return () => clearTimeout(t); }, []);

  const items = isPremium
    ? [
        { icon: <Icon.Sparkles width="14" height="14" />, label: "AI Analiz", used: 24,  cap: "∞", pct: 0.30, hint: "Bu ay yapıldı — sınırsız" },
        { icon: <Icon.Briefcase width="14" height="14" />, label: "İlan Başvurusu", used: 42, cap: "∞", pct: 0.42, hint: "Bu ay aktif — sınırsız" },
        { icon: <Icon.Bolt width="14" height="14" />, label: "Öncelikli Süre", used: "1.2s", cap: "ort.", pct: 0.15, hint: "Standart kullanıcılardan <b>3× hızlı</b>" },
      ]
    : [
        { icon: <Icon.Sparkles width="14" height="14" />, label: "AI Analiz", used: 1, cap: 3,  pct: 0.33, hint: "Bu ay 2 hak kaldı" },
        { icon: <Icon.Briefcase width="14" height="14" />, label: "İlan Başvurusu", used: 8, cap: 15, pct: 0.53, hint: "7 başvuru hakkın kaldı" },
        { icon: <Icon.Message width="14" height="14" />, label: "Mesajlaşma", used: 12, cap: 20, pct: 0.60, hint: "Bu ay 8 mesaj hakkın kaldı" },
      ];
  const cls = (p) => p >= 0.75 ? "high" : p >= 0.5 ? "mid" : "low";
  return (
    <div className="usage-grid">
      {items.map((it, i) => (
        <div key={i} className="usage">
          <div className="usage__head">
            <span className="usage__label">{it.icon} {it.label}</span>
            <span className="usage__limit">/ {it.cap}</span>
          </div>
          <div className="usage__num">{it.used}<small>kullanıldı</small></div>
          <div className="usage__bar">
            <div className={`usage__fill usage__fill--${cls(it.pct)}`}
              style={{ width: a ? `${Math.round(it.pct * 100)}%` : "0%" }} />
          </div>
          <div className="usage__hint" dangerouslySetInnerHTML={{ __html: it.hint }} />
        </div>
      ))}
    </div>
  );
}

// ---------- Plan compare ----------
function PlanCompare({ billed, setBilled, current }) {
  const monthly = billed === "monthly";
  const plans = [
    {
      key: "free",
      name: "Free",
      pitch: "Platformu denemek ve temel özelliklere erişmek için.",
      price: 0, unit: "her zaman ücretsiz",
      feats: [
        { has: true,  text: <>Ayda <b>3</b> AI analiz hakkı</> },
        { has: true,  text: <>15 ilan başvurusu / ay</> },
        { has: true,  text: <>GitHub doğrulama</> },
        { has: true,  text: <>Temel skill comparison</> },
        { has: false, text: <>Sınırsız AI analiz</> },
        { has: false, text: <>AI ile öne çıkar (ilan başvuruları)</> },
        { has: false, text: <>Öncelikli destek</> },
      ],
      cta: "Aktif plan",
    },
    {
      key: "premium",
      name: "Premium",
      popular: true,
      pitch: "AI'nin tam gücüyle iş bul, sınırsız analiz, öncelik.",
      price: monthly ? 199 : 1791,
      unit: monthly ? "/ ay" : "/ yıl",
      feats: [
        { has: true, text: <><b>Sınırsız</b> AI analiz</> },
        { has: true, text: <><b>Sınırsız</b> ilan başvurusu</> },
        { has: true, text: <>GitHub + LinkedIn doğrulama</> },
        { has: true, text: <>Detaylı skill comparison + öneriler</> },
        { has: true, text: <><b>AI ile öne çıkar</b> — başvurular ön plana</> },
        { has: true, text: <>Profil önce gösterilir (boost)</> },
        { has: true, text: <>Öncelikli destek (24 sa)</> },
      ],
      cta: monthly ? "Aylık ₺199 ile yükselt" : "Yıllık ₺1.791 ile yükselt",
    },
    {
      key: "pro",
      name: "Pro",
      pitch: "Kariyer koçluğu + sınırsız her şey + öncelikli AI.",
      price: monthly ? 449 : 4041,
      unit: monthly ? "/ ay" : "/ yıl",
      feats: [
        { has: true, text: <><b>Premium'daki tüm özellikler</b></> },
        { has: true, text: <>Birebir <b>kariyer koçu</b> seansları (ayda 2)</> },
        { has: true, text: <>CV redaksiyonu — uzman ekip</> },
        { has: true, text: <>Maaş benchmark raporu</> },
        { has: true, text: <>API erişimi (recruiter widget)</> },
        { has: true, text: <>Beta özelliklere erken erişim</> },
        { has: true, text: <>Özel hesap yöneticisi</> },
      ],
      cta: monthly ? "Aylık ₺449 ile yükselt" : "Yıllık ₺4.041 ile yükselt",
    },
  ];

  return (
    <div className="compare-section">
      <div className="section-title">
        <span className="section-title__name"><Icon.Crown width="14" height="14" /> Planları karşılaştır</span>
        <div className="role-toggle">
          <button data-active={billed === "monthly"} onClick={() => setBilled("monthly")}>Aylık</button>
          <button data-active={billed === "yearly"}  onClick={() => setBilled("yearly")}>
            Yıllık <span style={{ color: "hsl(calc(218 + var(--ai-hue)) 92% 72%)" }}>−%25</span>
          </button>
        </div>
      </div>
      <div className="compare">
        {plans.map(p => {
          const isPopular = p.popular;
          const isCurrent = p.key === current;
          const inner = (
            <>
              <div className="plan__head">
                {isPopular && <div className="plan-tag"><Icon.Sparkles width="10" height="10" /> Tavsiye edilen</div>}
                <div className="plan__name">{p.name}</div>
                <div className="plan__pitch">{p.pitch}</div>
              </div>
              <div className="plan__price">
                <span className="plan__price-num">{p.price === 0 ? "₺0" : `₺${p.price.toLocaleString("tr-TR")}`}</span>
                <span className="plan__price-unit">{p.unit}</span>
              </div>
              <div className="plan__features">
                {p.feats.map((f, i) => (
                  <div key={i} className={`plan__feat plan__feat--${f.has ? "in" : "out"}`}>
                    {f.has
                      ? <Icon.Check width="14" height="14" />
                      : <Icon.X width="14" height="14" />}
                    <div>{f.text}</div>
                  </div>
                ))}
              </div>
              {isCurrent
                ? <button className="btn btn--outline btn--lg" disabled style={{ opacity: 0.55, cursor: "default", width: "100%" }}>{p.cta}</button>
                : isPopular
                  ? <button className="btn btn--ai btn--lg btn--pulse" style={{ width: "100%" }}><Icon.Sparkles /> {p.cta}</button>
                  : <button className="btn btn--outline btn--lg" style={{ width: "100%" }}>{p.cta}</button>}
            </>
          );
          return isPopular
            ? <div key={p.key} className="plan plan--popular"><div className="plan__inner">{inner}</div></div>
            : <div key={p.key} className="plan">{inner}</div>;
        })}
      </div>
    </div>
  );
}

// ---------- Premium feature highlights ----------
function FeatureGrid() {
  const tiles = [
    { icon: <Icon.Sparkles />, title: "Sınırsız AI analiz", sub: "Her CV değişikliğinde yeni analiz çalıştır, skoru gözle gör." },
    { icon: <Icon.Bolt />,     title: "AI ile öne çıkar", sub: "Başvuruların işverenin AI sıralamasında üst sıralarda görünür." },
    { icon: <Icon.Target />,   title: "Akıllı eşleşme",   sub: "Algoritma sana özel ilanları her gün önerir." },
    { icon: <Icon.Shield />,   title: "Öncelikli destek", sub: "Sorunlarına 24 saat içinde uzman ekipten cevap." },
  ];
  return (
    <div className="feat-grid">
      {tiles.map((t, i) => (
        <div key={i} className="feat-tile">
          <div className="feat-tile__icon">{t.icon}</div>
          <div className="feat-tile__title">{t.title}</div>
          <div className="feat-tile__sub">{t.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ---------- Invoices ----------
function Invoices({ current }) {
  const invoices = current === "premium"
    ? [
        { num: "INV-2026-005", title: "Premium aylık · Mayıs", date: "12 May 2026", amount: "₺199,00", status: "paid" },
        { num: "INV-2026-004", title: "Premium aylık · Nisan", date: "12 Nis 2026", amount: "₺199,00", status: "paid" },
        { num: "INV-2026-003", title: "Premium aylık · Mart",  date: "12 Mar 2026", amount: "₺199,00", status: "paid" },
      ]
    : [];
  return (
    <div className="card">
      <div className="section-title">
        <span className="section-title__name"><Icon.Receipt /> Fatura geçmişi</span>
        <span className="section-title__more">PDF olarak indir <Icon.Arrow /></span>
      </div>
      {invoices.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13.5 }}>
          <Icon.Receipt width="22" height="22" style={{ marginBottom: 10, opacity: 0.6 }} /><br />
          Henüz faturan yok. Premium'a yükseldiğinde burada listelenir.
        </div>
      ) : (
        <div>
          {invoices.map((iv, i) => (
            <div key={i} className="inv-row">
              <div>
                <div className="inv-row__num">{iv.num} · {iv.date}</div>
                <div className="inv-row__title">{iv.title}</div>
              </div>
              <span className="inv-row__amount">{iv.amount}</span>
              <span className={`inv-row__status inv-row__status--${iv.status}`}>{iv.status === "paid" ? "Ödendi" : "Bekliyor"}</span>
              <span className="inv-row__dl"><Icon.Download /></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- FAQ ----------
function FAQ() {
  const [open, setOpen] = React.useState(0);
  const qs = [
    { q: "İstediğim zaman iptal edebilir miyim?", a: "Evet. Premium aboneliğini istediğin an iptal edebilirsin — kalan süre boyunca özellikleri kullanmaya devam edersin, otomatik yenileme durur." },
    { q: "Yıllık plana geçersem ne kazanırım?",   a: "Yıllık planda %25 indirim alırsın; ayrıca beta özelliklere 2 hafta daha erken erişim hakkın olur." },
    { q: "AI analizim ne sıklıkla güncelleniyor?",a: "CV'ni veya GitHub bağlantını güncellediğinde anında. Premium'da bekleme süresi yok, ücretsiz planda günde 1 limit var." },
    { q: "Şirket hesabıyla aynı plan mı?",         a: "Hayır — şirket planları (Starter / Business / Enterprise) farklı limit ve özelliklere sahiptir. Şirket profilinden yönetilir." },
    { q: "İade politikanız var mı?",               a: "İlk 14 gün içinde, koşulsuz iade hakkın bulunur. Hesap yöneticine yazman yeterli." },
  ];
  return (
    <div className="card">
      <div className="section-title">
        <span className="section-title__name"><Icon.FileText width="14" height="14" /> Sıkça sorulan sorular</span>
      </div>
      <div className="faq">
        {qs.map((it, i) => (
          <div key={i} className="faq__item" data-open={open === i}>
            <div className="faq__q" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{it.q}</span>
              <Icon.Chevron width="16" height="16" />
            </div>
            <div className="faq__a">{it.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- App ----------
function App() {
  const [t, setTweak] = useTweaks(BILLING_TWEAKS);

  React.useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.style.setProperty("--ai-intensity", t.aiIntensity);
    document.documentElement.style.setProperty("--ai-hue", t.aiHue);
  }, [t.theme, t.aiIntensity, t.aiHue]);

  const setTheme = (v) => setTweak("theme", v);

  return (
    <div className="app">
      <UserSidebar theme={t.theme} setTheme={setTheme} />
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
              <div className="page-head__crumbs">ABONELİK</div>
            </div>
            <div className="page-head__actions">
              <div className="role-toggle" title="Mevcut plan demo">
                <button data-active={t.currentPlan === "free"}    onClick={() => setTweak("currentPlan", "free")}>FREE</button>
                <button data-active={t.currentPlan === "premium"} onClick={() => setTweak("currentPlan", "premium")}>PREMIUM</button>
              </div>
            </div>
          </div>

          <PlanHero current={t.currentPlan} />
          <div className="qa-section">
            <div className="section-title">
              <span className="section-title__name"><Icon.Activity width="14" height="14" /> Bu ay kullanımın</span>
              <span className="section-title__more">1 Haz'da sıfırlanır</span>
            </div>
            <Usage current={t.currentPlan} />
          </div>
          <PlanCompare billed={t.billed} setBilled={(v) => setTweak("billed", v)} current={t.currentPlan} />
          <div className="qa-section">
            <div className="section-title">
              <span className="section-title__name"><Icon.Sparkles width="14" height="14" /> Premium'da neler var?</span>
            </div>
            <FeatureGrid />
          </div>
          <div className="split">
            <Invoices current={t.currentPlan} />
            <FAQ />
          </div>
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Sayfa" />
        <TweakRadio
          label="Mevcut plan"
          value={t.currentPlan}
          options={["free", "premium"]}
          onChange={(v) => setTweak("currentPlan", v)}
        />
        <TweakRadio
          label="Faturalandırma"
          value={t.billed}
          options={["monthly", "yearly"]}
          onChange={(v) => setTweak("billed", v)}
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
