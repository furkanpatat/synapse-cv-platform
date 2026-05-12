/* ============================================================
   Auth — login + register + verify-email
   ============================================================ */

Object.assign(Icon, {
  Search: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
    </svg>
  ),
  Mail: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
    </svg>
  ),
  Lock: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    </svg>
  ),
  Eye: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Google: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...p}>
      <path d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" fill="#34A853"/>
      <path d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/>
    </svg>
  ),
  Bldg: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M8 6h2M14 6h2M8 10h2M14 10h2M8 14h2M14 14h2M10 22v-4h4v4"/>
    </svg>
  ),
});

const AUTH_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "aiIntensity": 0.7,
  "aiHue": 0,
  "page": "login",
  "registerKind": "user"
}/*EDITMODE-END*/;

// ---------- Decorative left pane ----------
function AuthLeft({ page }) {
  const quotes = {
    login: {
      text: "AI raporu açtığım gün, hangi rollere gerçekten uygun olduğumu net gördüm. İlk 2 hafta içinde 3 mülakat aldım.",
      who: "Aslı Tunç", role: "Senior Frontend · Helix Health", initials: "AT",
    },
    register: {
      text: "Ekibim 47 başvuru arasından AI sıralamasıyla doğru 5 adayı dakikalar içinde belirledi.",
      who: "Murat Demir", role: "Talent Lead · Vektör Yazılım", initials: "MD",
    },
    verify: {
      text: "Sadece 2 dakikada hesabımı doğruladım, 5 dakika sonra ilk eşleşmem geldi.",
      who: "Ece Yılmaz", role: "React Developer · Argon Labs", initials: "EY",
    },
  };
  const q = quotes[page] || quotes.login;

  // Decorative sparkles around orb
  const sparks = [
    { x: 10, y: 15, d: 0   }, { x: 88, y: 22, d: 0.4 }, { x: 16, y: 78, d: 0.8 },
    { x: 90, y: 75, d: 1.2 }, { x: 50, y: 8,  d: 1.6 }, { x: 5,  y: 50, d: 2.0 },
    { x: 95, y: 48, d: 2.4 }, { x: 70, y: 90, d: 1.4 },
  ];

  return (
    <div className="auth-left">
      <div className="auth-brand">
        <span className="auth-brand__mark"><Icon.Logo /></span>
        Synapse
      </div>

      <div className="orb-wrap">
        <div className="orb">
          <div className="orb-ring"></div>
          <div className="orb-ring orb-ring--2"></div>
          <div className="orb-ring orb-ring--3"></div>
          <div className="orb-core"></div>
          {sparks.map((s, i) => (
            <div key={i} className="orb-spark"
              style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.d}s` }} />
          ))}
        </div>
      </div>

      <div>
        <p className="auth-quote">"{q.text}"</p>
        <div className="auth-quote-meta">
          <div className="auth-quote-meta__avatar">{q.initials}</div>
          <div>
            <div style={{ color: "white", fontFamily: "Geist, sans-serif", letterSpacing: "-0.01em" }}>{q.who}</div>
            <div>{q.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- LOGIN ----------
function Login({ goRegister, goVerify }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="auth-card">
      <div className="auth-card__eyebrow"><Icon.Sparkles width="12" height="12" /> Tekrar hoş geldin</div>
      <h1 className="auth-card__title">Hesabına <span className="ai-text">giriş yap</span></h1>
      <p className="auth-card__sub">AI skorun ve başvuruların seni bekliyor. Devam etmek için e-posta ve şifrenle giriş yap.</p>

      <div className="social-grid">
        <button className="social-btn"><Icon.Google /> Google ile</button>
        <button className="social-btn"><Icon.Github width="16" height="16" /> GitHub ile</button>
      </div>
      <div className="divider">YA DA</div>

      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); goVerify(); }}>
        <div className="field">
          <label>E-POSTA</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
              <Icon.Mail />
            </span>
            <input type="email" placeholder="ahmet@example.com" defaultValue="ahmet@example.com"
              style={{ paddingLeft: 38 }} />
          </div>
        </div>
        <div className="field">
          <label>ŞİFRE</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
              <Icon.Lock />
            </span>
            <input type={show ? "text" : "password"} placeholder="••••••••••"
              defaultValue="superdupersafe"
              style={{ paddingLeft: 38, paddingRight: 38 }} />
            <span onClick={() => setShow(!show)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", cursor: "pointer" }}>
              <Icon.Eye />
            </span>
          </div>
        </div>

        <div className="auth-options">
          <label className="cbox">
            <input type="checkbox" defaultChecked />
            <span className="cbox__box"><Icon.Check width="10" height="10" /></span>
            Beni hatırla
          </label>
          <a href="#">Şifremi unuttum</a>
        </div>

        <button type="submit" className="btn btn--ai btn--lg" style={{ width: "100%", marginTop: 6 }}>
          <Icon.Sparkles width="14" height="14" /> Giriş yap
        </button>
      </form>

      <div className="auth-right__top-link" style={{ marginTop: 22, textAlign: "center" }}>
        Hesabın yok mu?
        <a href="#" onClick={(e) => { e.preventDefault(); goRegister(); }}>Hemen kayıt ol</a>
      </div>
    </div>
  );
}

// ---------- REGISTER ----------
function Register({ goLogin, goVerify, kind, setKind }) {
  const [pw, setPw] = React.useState("");
  const strength = Math.min(4, Math.floor(pw.length / 3));
  const stLabel = ["—", "Zayıf", "Orta", "İyi", "Güçlü"][strength];

  return (
    <div className="auth-card">
      <div className="auth-card__eyebrow"><Icon.Sparkles width="12" height="12" /> Synapse'e katıl</div>
      <h1 className="auth-card__title">Hesabını <span className="ai-text">oluştur</span></h1>
      <p className="auth-card__sub">İlk AI analizini <b style={{ color: "var(--text)" }}>ücretsiz</b> yap. 2 dakikada başla.</p>

      <div className="tab-switch">
        <button data-active={kind === "user"} data-kind="ai" onClick={() => setKind("user")}>
          <Icon.User width="14" height="14" /> Birey
        </button>
        <button data-active={kind === "company"} onClick={() => setKind("company")}>
          <Icon.Bldg /> Şirket
        </button>
      </div>

      <div className="social-grid">
        <button className="social-btn"><Icon.Google /> Google ile</button>
        <button className="social-btn"><Icon.Github width="16" height="16" /> GitHub ile</button>
      </div>
      <div className="divider">YA DA</div>

      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); goVerify(); }}>
        {kind === "user" ? (
          <div className="form-row">
            <div className="field"><label>AD</label><input placeholder="Ahmet" defaultValue="Ahmet" /></div>
            <div className="field"><label>SOYAD</label><input placeholder="Yılmaz" defaultValue="Yılmaz" /></div>
          </div>
        ) : (
          <>
            <div className="field"><label>ŞİRKET ADI</label><input placeholder="Vektör Yazılım A.Ş." defaultValue="Vektör Yazılım A.Ş." /></div>
            <div className="form-row">
              <div className="field"><label>WEBSITESİ</label><input placeholder="vektor.com.tr" defaultValue="vektor.com.tr" /></div>
              <div className="field">
                <label>ÇALIŞAN</label>
                <select defaultValue="11-50">
                  <option>1–10</option><option>11–50</option><option>51–200</option><option>200+</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div className="field">
          <label>{kind === "company" ? "İŞ E-POSTASI" : "E-POSTA"}</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
              <Icon.Mail />
            </span>
            <input type="email" placeholder={kind === "company" ? "isim@sirketin.com" : "ahmet@example.com"} style={{ paddingLeft: 38 }} />
          </div>
        </div>

        <div className="field">
          <label>ŞİFRE</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
              <Icon.Lock />
            </span>
            <input type="password" placeholder="En az 8 karakter, sayı ve büyük harf"
              value={pw} onChange={(e) => setPw(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>
          <div className="pw-strength">
            {[1,2,3,4].map(i => <div key={i} className="pw-bar" data-on={strength >= i} />)}
          </div>
          <div className="pw-label">Güç: {stLabel}</div>
        </div>

        <label className="cbox" style={{ marginTop: 4 }}>
          <input type="checkbox" defaultChecked />
          <span className="cbox__box"><Icon.Check width="10" height="10" /></span>
          <span style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
            <a href="#" style={{ color: "var(--text)", borderBottom: "1px solid var(--border-strong)" }}>Kullanım koşulları</a> ve <a href="#" style={{ color: "var(--text)", borderBottom: "1px solid var(--border-strong)" }}>gizlilik politikasını</a> okudum, kabul ediyorum.
          </span>
        </label>

        <button type="submit" className="btn btn--ai btn--lg" style={{ width: "100%", marginTop: 6 }}>
          <Icon.Sparkles width="14" height="14" /> {kind === "company" ? "Şirket hesabını oluştur" : "Hesabımı oluştur"}
        </button>
      </form>

      <div className="auth-right__top-link" style={{ marginTop: 22, textAlign: "center" }}>
        Zaten hesabın var mı?
        <a href="#" onClick={(e) => { e.preventDefault(); goLogin(); }}>Giriş yap</a>
      </div>
    </div>
  );
}

// ---------- VERIFY EMAIL ----------
function Verify({ goLogin }) {
  return (
    <div className="verify-app">
      <div className="verify-card">
        <div className="verify-card__inner">
          <div className="verify-orb"><Icon.Mail width="32" height="32" /></div>
          <div className="auth-card__eyebrow" style={{ justifyContent: "center" }}>
            <Icon.Sparkles width="12" height="12" /> SON ADIM
          </div>
          <h1 className="verify-title">E-posta'nı <span className="ai-text">doğrula</span></h1>
          <p className="verify-sub">
            Aktivasyon bağlantısını gönderdik. Gelen kutunu kontrol et — bağlantıya tıkladığında Synapse seni karşılayacak.
          </p>
          <div className="verify-email">
            <Icon.Mail />
            ahmet@example.com
          </div>
          <div className="verify-actions">
            <button className="btn btn--ai btn--lg" style={{ width: "100%" }} onClick={goLogin}>
              <Icon.Check width="14" height="14" /> Gelen kutusuna git
            </button>
            <button className="btn btn--outline btn--sm" style={{ width: "100%" }}>
              Farklı e-posta kullan
            </button>
          </div>
          <div className="verify-resend">
            Bağlantı gelmedi mi? <a href="#">Tekrar gönder (00:42)</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- App ----------
function App() {
  const [t, setTweak] = useTweaks(AUTH_TWEAKS);

  React.useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.style.setProperty("--ai-intensity", t.aiIntensity);
    document.documentElement.style.setProperty("--ai-hue", t.aiHue);
  }, [t.theme, t.aiIntensity, t.aiHue]);

  const setTheme = (v) => setTweak("theme", v);

  if (t.page === "verify") {
    return (
      <>
        <div className="auth-page-toggle">
          <div className="role-toggle">
            <button data-active={t.page === "login"}    onClick={() => setTweak("page", "login")}>Giriş</button>
            <button data-active={t.page === "register"} onClick={() => setTweak("page", "register")}>Kayıt</button>
            <button data-active={t.page === "verify"}   onClick={() => setTweak("page", "verify")}>Doğrula</button>
          </div>
        </div>
        <Verify goLogin={() => setTweak("page", "login")} />
        <TweaksUI t={t} setTweak={setTweak} />
      </>
    );
  }

  return (
    <>
      <div className="auth-page-toggle">
        <div className="role-toggle">
          <button data-active={t.page === "login"}    onClick={() => setTweak("page", "login")}>Giriş</button>
          <button data-active={t.page === "register"} onClick={() => setTweak("page", "register")}>Kayıt</button>
          <button data-active={t.page === "verify"}   onClick={() => setTweak("page", "verify")}>Doğrula</button>
        </div>
      </div>

      <div className="auth-app">
        <AuthLeft page={t.page} />
        <div className="auth-right">
          <div className="auth-right__top">
            <div className="auth-brand auth-right__top-brand" style={{ color: "var(--text)" }}>
              <span className="auth-brand__mark"><Icon.Logo /></span>
              Synapse
            </div>
            <div className="auth-right__top-link" style={{ marginLeft: "auto" }}>
              <ThemeToggle theme={t.theme} setTheme={setTheme} />
            </div>
          </div>

          {t.page === "login" && (
            <Login
              goRegister={() => setTweak("page", "register")}
              goVerify={() => setTweak("page", "verify")} />
          )}
          {t.page === "register" && (
            <Register
              goLogin={() => setTweak("page", "login")}
              goVerify={() => setTweak("page", "verify")}
              kind={t.registerKind}
              setKind={(v) => setTweak("registerKind", v)} />
          )}

          <div className="auth-footer">
            <span>© 2026 SYNAPSE</span>
            <span>GİZLİLİK · KOŞULLAR</span>
          </div>
        </div>
      </div>

      <TweaksUI t={t} setTweak={setTweak} />
    </>
  );
}

function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Sayfa" />
      <TweakSelect
        label="Görünen"
        value={t.page}
        options={[
          { value: "login",    label: "Giriş" },
          { value: "register", label: "Kayıt ol" },
          { value: "verify",   label: "E-posta doğrulama" },
        ]}
        onChange={(v) => setTweak("page", v)}
      />
      <TweakRadio
        label="Kayıt tipi"
        value={t.registerKind}
        options={["user", "company"]}
        onChange={(v) => setTweak("registerKind", v)}
      />
      <TweakSection label="Tema" />
      <TweakRadio label="Mod" value={t.theme} options={["dark", "light"]} onChange={(v) => setTweak("theme", v)} />
      <TweakSection label="AI Vurgusu" />
      <TweakSlider label="Yoğunluk" value={t.aiIntensity} min={0.2} max={1.2} step={0.05} onChange={(v) => setTweak("aiIntensity", v)} />
      <TweakSlider label="Renk tonu" value={t.aiHue} min={-60} max={120} step={5} unit="°" onChange={(v) => setTweak("aiHue", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
