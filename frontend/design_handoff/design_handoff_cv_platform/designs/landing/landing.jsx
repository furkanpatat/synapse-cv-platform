/* ============================================================
   Synapse — main app: nav + hero + tweaks + mount
   ============================================================ */

const LANDING_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "aiIntensity": 0.7,
  "aiHue": 0
}/*EDITMODE-END*/;

function Nav({ theme, setTheme }) {
  return (
    <header className="nav">
      <div className="container nav__inner">
        <a className="nav__brand" href="#">
          <span className="nav__brand-mark"><Icon.Logo /></span>
          Synapse
        </a>
        <nav className="nav__links">
          <a className="nav__link" href="#features">Özellikler</a>
          <a className="nav__link" href="#analysis-preview">AI Analizi</a>
          <a className="nav__link" href="#pricing">Fiyatlandırma</a>
          <a className="nav__link" href="#">Şirketler</a>
          <a className="nav__link" href="#">Belgeler</a>
        </nav>
        <div className="nav__right">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <a className="btn btn--ghost btn--sm" href="#">Giriş yap</a>
          <a className="btn btn--ai btn--sm" href="#"><Icon.Sparkles width="14" height="14" /> Başla</a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="bg-grid"></div>
      <div className="container">
        <div className="hero__grid">
          <div>
            <div className="hero__eyebrow reveal is-in">
              <AiBadge>Gemini AI ile çalışır</AiBadge>
            </div>
            <h1 className="hero__title reveal is-in" data-delay="1">
              CV'nin gerçekliğini <span className="ai-text">AI ile doğrula</span>.
            </h1>
            <p className="hero__sub reveal is-in" data-delay="2">
              CV'ni yükle, GitHub'ını bağla. Yapay zekâ her yetkinliği kanıtla eşleştirsin — 0–100 arası tek bir skorda.
            </p>
            <div className="hero__cta reveal is-in" data-delay="3">
              <button className="btn btn--ai btn--lg">
                <Icon.Sparkles /> Ücretsiz başla
              </button>
              <button className="btn btn--outline btn--lg">
                Demoyu izle <Icon.Arrow />
              </button>
            </div>
            <div className="hero__meta reveal is-in" data-delay="4">
              <span className="hero__meta-item"><Icon.Shield width="14" height="14" /> KVKK uyumlu</span>
              <span className="hero__meta-item"><Icon.Github width="14" height="14" /> GitHub doğrulama</span>
              <span className="hero__meta-item"><Icon.Check width="14" height="14" /> Kredi kartı yok</span>
            </div>
          </div>
          <div className="hero__visual">
            <Orb />
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [t, setTweak] = useTweaks(LANDING_TWEAKS);

  React.useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.style.setProperty("--ai-intensity", t.aiIntensity);
    document.documentElement.style.setProperty("--ai-hue", t.aiHue);
  }, [t.theme, t.aiIntensity, t.aiHue]);

  useReveal();

  return (
    <>
      <Nav theme={t.theme} setTheme={(v) => setTweak("theme", v)} />
      <main>
        <Hero />
        <Logos />
        <div id="features"><Features /></div>
        <AnalysisPreview />
        <HowItWorks />
        <div id="pricing"><Pricing /></div>
        <FinalCTA />
      </main>
      <Footer />

      <TweaksPanel title="Tweaks">
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
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
