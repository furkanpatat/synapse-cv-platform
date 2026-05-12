/* ============================================================
   Synapse — page sections
   ============================================================ */

// ---------- Logos / social proof ----------
function Logos() {
  return (
    <section className="logos">
      <div className="container">
        <div className="logos__title">1.200+ ekip Synapse ile işe alım yapıyor</div>
        <div className="logos__row">
          <div className="logo-mark"><span className="logo-mark__dot"></span>northwind</div>
          <div className="logo-mark"><span className="logo-mark__sq"></span>Vektör</div>
          <div className="logo-mark"><span className="logo-mark__bar"></span>Kabin</div>
          <div className="logo-mark"><span className="logo-mark__dot"></span>Helix</div>
          <div className="logo-mark"><span className="logo-mark__sq"></span>Argon</div>
          <div className="logo-mark"><span className="logo-mark__bar"></span>Polari</div>
        </div>
      </div>
    </section>
  );
}

// ---------- Features ----------
function Features() {
  return (
    <section className="section">
      <div className="container">
        <div className="s-head reveal">
          <span className="s-head__eyebrow">Yetenekler</span>
          <h2 className="s-head__title">CV'nin arkasındaki <span className="ai-text">gerçek yetkinliği</span> görür.</h2>
          <p className="s-head__sub">Üç katman: anlama, doğrulama, eşleştirme. Hepsi tek bir akışta, otomatik.</p>
        </div>

        <div className="features-grid">
          <div className="feature feature--ai reveal" data-delay="1">
            <div className="feature__icon"><Icon.FileText /></div>
            <h3 className="feature__title">AI ile CV ayrıştırma</h3>
            <p className="feature__body">Gemini destekli parser, PDF/DOCX'ten yapılandırılmış veri çıkarır — kişisel, deneyim, eğitim, projeler, skills.</p>
            <div className="feature__viz">
              <div className="miniviz-skills">
                <div className="miniviz-skill">
                  <span className="miniviz-skill__name">React</span>
                  <div className="miniviz-skill__bar"><div className="miniviz-skill__fill miniviz-skill__fill--high" style={{ width: "92%" }}></div></div>
                </div>
                <div className="miniviz-skill">
                  <span className="miniviz-skill__name">TypeScript</span>
                  <div className="miniviz-skill__bar"><div className="miniviz-skill__fill miniviz-skill__fill--high" style={{ width: "78%" }}></div></div>
                </div>
                <div className="miniviz-skill">
                  <span className="miniviz-skill__name">PostgreSQL</span>
                  <div className="miniviz-skill__bar"><div className="miniviz-skill__fill miniviz-skill__fill--med" style={{ width: "54%" }}></div></div>
                </div>
                <div className="miniviz-skill">
                  <span className="miniviz-skill__name">GraphQL</span>
                  <div className="miniviz-skill__bar"><div className="miniviz-skill__fill miniviz-skill__fill--low" style={{ width: "28%" }}></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="feature reveal" data-delay="2">
            <div className="feature__icon"><Icon.Github /></div>
            <h3 className="feature__title">GitHub ile doğrulama</h3>
            <p className="feature__body">Beyan ettiği teknolojiyi gerçekten kullanmış mı? Commit'leri, dil dağılımını ve sürekliliği kontrol eder.</p>
            <div className="feature__viz">
              <div className="miniviz-gh">
                {Array.from({ length: 84 }, (_, i) => {
                  const seed = (i * 9301 + 49297) % 233280 / 233280;
                  const lvl = seed > 0.85 ? 4 : seed > 0.65 ? 3 : seed > 0.4 ? 2 : seed > 0.2 ? 1 : 0;
                  const colors = ["var(--surface-3)", "rgba(16,185,129,0.25)", "rgba(16,185,129,0.45)", "rgba(16,185,129,0.7)", "rgba(16,185,129,0.95)"];
                  return <div key={i} className="miniviz-gh__cell" style={{ background: colors[lvl] }}></div>;
                })}
              </div>
            </div>
          </div>

          <div className="feature reveal" data-delay="3">
            <div className="feature__icon"><Icon.Target /></div>
            <h3 className="feature__title">İlan – aday eşleştirme</h3>
            <p className="feature__body">İlanın gereksinimleri ile aday yetkinliğini karşılaştırır. Şirketler için ön sıralı liste, adaylar için uygunluk skoru.</p>
            <div className="feature__viz">
              <div className="miniviz-match">
                <div className="miniviz-match__ring"><span>%78</span></div>
                <div className="miniviz-match__details">
                  <span style={{ color: "#34d399" }}>● React · eşleşme</span>
                  <span style={{ color: "#34d399" }}>● Node · eşleşme</span>
                  <span style={{ color: "#fbbf24" }}>● Kıdem · orta</span>
                  <span style={{ color: "var(--text-muted)" }}>● Konum · uzak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- AI Analysis preview ----------
function AnalysisPreview() {
  const containerRef = React.useRef(null);
  const [active, setActive] = React.useState(false);
  const [typedText, setTypedText] = React.useState("");
  const fullText = "Aday, React ve Node.js'te ileri seviye kanıtlanmış katkıya sahip. TypeScript kullanımı tutarlı ancak ileri patternlerde sınırlı. GraphQL beyanı GitHub aktivitesiyle yeterince desteklenmiyor — mülakatta sondalanmalı.";

  React.useEffect(() => {
    if (!containerRef.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setActive(true); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [active]);

  const skills = [
    { name: "React",       level: 92, chip: "high", label: "DOĞRULANDI" },
    { name: "Node.js",     level: 88, chip: "high", label: "DOĞRULANDI" },
    { name: "TypeScript",  level: 72, chip: "med",  label: "ORTA" },
    { name: "PostgreSQL",  level: 64, chip: "med",  label: "ORTA" },
    { name: "GraphQL",     level: 32, chip: "low",  label: "TUTARSIZ" },
  ];

  return (
    <section className="section" id="analysis-preview">
      <div className="container">
        <div className="s-head reveal">
          <span className="s-head__eyebrow">AI Yetkinlik Raporu</span>
          <h2 className="s-head__title">Tek bir bakışta, <span className="ai-text">gerçek</span>.</h2>
          <p className="s-head__sub">Yapay zekâ, beyan ile gerçeği yan yana koyar. Skor, dökümlenmiş gerekçeleriyle birlikte gelir.</p>
        </div>

        <div className="preview reveal" ref={containerRef}>
          <div className="preview__inner">
            <div className="preview__score">
              <div className="score-ring">
                <div className="score-ring__bg" style={{ "--score": active ? 87 : 0 }}></div>
                <div className="score-ring__inner">
                  <div>
                    <span className="score-ring__num">{active ? 87 : 0}</span>
                    <span className="score-ring__suffix">/100</span>
                    <div className="score-ring__label">GENEL SKOR</div>
                  </div>
                </div>
              </div>
              <div className="score-meta">
                <div className="score-meta__row"><span>Yetkinlik</span><span>91</span></div>
                <div className="score-meta__row"><span>GitHub kanıtı</span><span>84</span></div>
                <div className="score-meta__row"><span>Tutarlılık</span><span>86</span></div>
                <div className="score-meta__row"><span>Güven aralığı</span><span>%92</span></div>
              </div>
            </div>

            <div className="preview__main">
              <div className="preview__header">
                <div>
                  <div className="preview__name">A. K. Yılmaz</div>
                  <div className="preview__role">Senior Frontend Engineer · 6 yıl deneyim</div>
                </div>
                <AiBadge>AI tarafından analiz edildi · 2 dk önce</AiBadge>
              </div>

              <div className="skill-list">
                {skills.map((s, i) => (
                  <div className="skill" key={s.name}>
                    <span className="skill__name">{s.name}</span>
                    <div className="skill__bar">
                      <div
                        className={`skill__fill skill__fill--${s.chip}`}
                        style={{ width: active ? `${s.level}%` : "0%", transitionDelay: `${i * 110}ms` }}
                      ></div>
                    </div>
                    <span className={`skill__chip skill__chip--${s.chip}`}>{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="preview__summary">
                <div className="preview__summary-label">
                  <Icon.Sparkles width="13" height="13" /> AI ÖZETİ
                </div>
                <div className={`preview__summary-text ${typedText.length >= fullText.length ? "preview__summary-text--done" : ""}`}>
                  {typedText || " "}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- How it works ----------
function HowItWorks() {
  const steps = [
    { icon: <Icon.Upload />, title: "CV yükle", body: "PDF veya DOCX yükle. Parser saniyeler içinde yapılandırılmış veri çıkarır." },
    { icon: <Icon.Github />,  title: "GitHub bağla", body: "Açık projelerini gözden geçirir; dil dağılımını ve katkı sürekliliğini ölçer." },
    { icon: <Icon.Activity />, title: "Raporu al", body: "0–100 skor, kanıtlı yetkinlikler ve tutarsızlık uyarıları. Tek bir tıkla paylaş." },
  ];
  return (
    <section className="section">
      <div className="container">
        <div className="s-head reveal">
          <span className="s-head__eyebrow">Akış</span>
          <h2 className="s-head__title">Üç adımda kanıta dayalı bir CV.</h2>
        </div>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div className="step reveal" data-delay={i + 1} key={i}>
              <div className="step__num">0{i + 1} · ADIM</div>
              <div className="step__icon-wrap">{s.icon}</div>
              <div className="step__title">{s.title}</div>
              <div className="step__body">{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Pricing ----------
function Pricing() {
  return (
    <section className="section">
      <div className="container">
        <div className="s-head reveal">
          <span className="s-head__eyebrow">Fiyatlandırma</span>
          <h2 className="s-head__title">Bireyler için ücretsiz. Şirketler için ölçekli.</h2>
        </div>

        <div className="pricing-grid">
          <div className="plan reveal" data-delay="1">
            <div className="plan__name">Free</div>
            <div className="plan__price">
              <span className="plan__amt">₺0</span>
              <span className="plan__per">/ ay</span>
            </div>
            <p className="plan__desc">Adaylar için temel doğrulama ve başvuru.</p>
            <ul className="plan__features">
              <li><Icon.Check /> Ayda 3 AI analizi</li>
              <li><Icon.Check /> CV parser + GitHub bağlama</li>
              <li><Icon.Check /> İlanlara sınırsız başvuru</li>
              <li><Icon.Check /> Mesajlaşma</li>
            </ul>
            <button className="btn btn--outline" style={{ width: "100%" }}>Ücretsiz başla</button>
          </div>

          <div className="plan plan--featured reveal" data-delay="2">
            <span className="plan__badge"><Icon.Star /> Tavsiye edilen</span>
            <div className="plan__name ai-text">Premium</div>
            <div className="plan__price">
              <span className="plan__amt">₺249</span>
              <span className="plan__per">/ ay</span>
            </div>
            <p className="plan__desc">Sınırsız analiz, derin görüş ve öncelikli eşleştirme.</p>
            <ul className="plan__features">
              <li><Icon.Sparkles className="ai" /> Sınırsız AI analizi</li>
              <li><Icon.Sparkles className="ai" /> Derin GitHub kanıt raporu</li>
              <li><Icon.Sparkles className="ai" /> Önerilen ilan akışı (öncelikli)</li>
              <li><Icon.Sparkles className="ai" /> İşveren görüş paneli</li>
              <li><Icon.Check /> Öncelikli destek</li>
            </ul>
            <button className="btn btn--ai" style={{ width: "100%" }}>
              <Icon.Sparkles /> Premium'a yükselt
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Final CTA ----------
function FinalCTA() {
  return (
    <section className="section">
      <div className="container">
        <div className="cta reveal">
          <AiBadge>Kuruluma 60 saniye</AiBadge>
          <h2 className="cta__title" style={{ marginTop: 14 }}>CV'ni <span className="ai-text">kanıta</span> dönüştür.</h2>
          <p className="cta__sub">Bir kez yükle. Yapay zekâ doğrulasın. Sonra her ilan sana gelsin.</p>
          <div className="cta__buttons">
            <button className="btn btn--ai btn--lg"><Icon.Sparkles /> Ücretsiz başla</button>
            <button className="btn btn--outline btn--lg">Şirket için demo iste <Icon.Arrow /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <div className="footer__brand-line">
              <span className="nav__brand-mark"><Icon.Logo /></span>
              <strong style={{ letterSpacing: "-0.02em" }}>Synapse</strong>
            </div>
            <p className="footer__tagline">AI destekli CV doğrulama ve yetkinlik eşleştirme platformu.</p>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Ürün</div>
            <ul>
              <li><a href="#">Özellikler</a></li>
              <li><a href="#">Fiyatlandırma</a></li>
              <li><a href="#">İlanlar</a></li>
              <li><a href="#">Şirketler için</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Şirket</div>
            <ul>
              <li><a href="#">Hakkımızda</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Kariyer</a></li>
              <li><a href="#">İletişim</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Yasal</div>
            <ul>
              <li><a href="#">Gizlilik</a></li>
              <li><a href="#">Kullanım koşulları</a></li>
              <li><a href="#">KVKK</a></li>
              <li><a href="#">AI yönergeleri</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 Synapse Labs · Türkiye</span>
          <div className="footer__bottom-right">
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

window.Logos = Logos;
window.Features = Features;
window.AnalysisPreview = AnalysisPreview;
window.HowItWorks = HowItWorks;
window.Pricing = Pricing;
window.FinalCTA = FinalCTA;
window.Footer = Footer;
