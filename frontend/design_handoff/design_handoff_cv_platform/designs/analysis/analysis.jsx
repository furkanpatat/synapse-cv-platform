/* ============================================================
   Analysis page main — state management + layout
   ============================================================ */

const ANALYSIS_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "aiIntensity": 0.7,
  "aiHue": 0
}/*EDITMODE-END*/;

function LoadingState() {
  const steps = [
    "CV ayrıştırılıyor...",
    "GitHub verisi çekiliyor...",
    "Beyan ve kanıt karşılaştırılıyor...",
    "Gemini AI'e gönderiliyor...",
    "Yetkinlik raporu derleniyor...",
  ];
  const [stepIdx, setStepIdx] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => {
      setStepIdx((i) => Math.min(steps.length - 1, i + 1));
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card card--ai">
      <div className="loading-state">
        <div className="loading-orb">
          <div className="loading-orb__glow"></div>
          <div className="loading-orb__ring"></div>
          <div className="loading-orb__core"></div>
        </div>
        <div className="loading-state__title">Analiz hazırlanıyor</div>
        <div className="loading-state__step">{steps[stepIdx]}</div>
        <div className="loading-progress">
          <div className="loading-progress__fill"></div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart }) {
  return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state__icon"><Icon.Sparkles width="22" height="22" /></div>
        <div className="empty-state__title">Henüz bir analizin yok</div>
        <p className="empty-state__sub">
          CV'ni yükle ve GitHub hesabını bağla. Yapay zekâ her yetkinliği kanıtla doğrulasın.
        </p>
        <div className="row">
          <button className="btn btn--ai btn--lg" onClick={onStart}>
            <Icon.Sparkles /> Analizi başlat
          </button>
          <button className="btn btn--outline btn--lg">
            <Icon.FileText width="14" height="14" /> CV yükle
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultView({ active }) {
  return (
    <div className="stack">
      <ScoreHero score={87} active={active} />
      <div className="analysis">
        <div className="stack">
          <Summary active={active} />
          <Inconsistencies />
        </div>
        <div className="stack">
          <Skills active={active} />
          <GithubEvidence active={active} />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(ANALYSIS_TWEAKS);
  const [stage, setStage] = React.useState("result"); // "empty" | "loading" | "result"
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.style.setProperty("--ai-intensity", t.aiIntensity);
    document.documentElement.style.setProperty("--ai-hue", t.aiHue);
  }, [t.theme, t.aiIntensity, t.aiHue]);

  // Kick off result animations once mounted
  React.useEffect(() => {
    if (stage !== "result") { setActive(false); return; }
    setActive(false);
    const id = setTimeout(() => setActive(true), 80);
    return () => clearTimeout(id);
  }, [stage]);

  const startAnalysis = () => {
    setStage("loading");
    setTimeout(() => setStage("result"), 3600);
  };

  const setTheme = (v) => setTweak("theme", v);

  return (
    <div className="app">
      <Sidebar theme={t.theme} setTheme={setTheme} />
      <div>
        <MobileBar theme={t.theme} setTheme={setTheme} />
        <main className="main">
          <div className="page-head">
            <div>
              <div className="page-head__crumbs">PANEL · AI ANALİZ</div>
              <h1 className="page-head__title">AI Yetkinlik Analizi</h1>
              <p className="page-head__sub">Beyanlarının arkasındaki kanıt. Skor, döküm ve tutarsızlıklar.</p>
            </div>
            <div className="page-head__actions">
              <div className="state-toggle" title="Demo: durumu değiştir">
                <button data-active={stage === "empty"}   onClick={() => setStage("empty")}>Boş</button>
                <button data-active={stage === "loading"} onClick={() => setStage("loading")}>Yükleniyor</button>
                <button data-active={stage === "result"}  onClick={() => setStage("result")}>Sonuç</button>
              </div>
              <button className="btn btn--outline btn--sm"><Icon.Download /> Raporu indir</button>
              <button className="btn btn--ai btn--sm" onClick={startAnalysis}>
                <Icon.Sparkles width="14" height="14" /> Yeniden analiz et
              </button>
            </div>
          </div>

          {stage === "empty"   && <EmptyState onStart={startAnalysis} />}
          {stage === "loading" && <LoadingState />}
          {stage === "result"  && <ResultView active={active} />}
        </main>
      </div>

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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
