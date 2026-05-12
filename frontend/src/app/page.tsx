import Link from "next/link";
import {
  Sparkles,
  Github,
  Shield,
  Check,
  ArrowRight,
  Brain,
  Target,
  FileText,
} from "lucide-react";

import { LandingNav } from "@/components/marketing/LandingNav";
import { AiBadge } from "@/components/ui/AiBadge";
import { AiOrb } from "@/components/ui/AiOrb";

export default function HomePage() {
  return (
    <>
      <LandingNav />

      <main>
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          <div className="bg-grid" />
          <div className="container-page">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <AiBadge>Gemini AI ile çalışır</AiBadge>
                <h1 className="mt-6 text-[clamp(40px,6.4vw,76px)] font-semibold leading-[1] tracking-tightest text-balance">
                  CV&apos;nin gerçekliğini{" "}
                  <span className="ai-text">AI ile doğrula</span>.
                </h1>
                <p className="mt-6 max-w-[540px] text-[clamp(16px,1.4vw,19px)] text-text-2 text-pretty">
                  CV&apos;ni yükle, GitHub&apos;ını bağla. Yapay zekâ her yetkinliği
                  kanıtla eşleştirsin — 0–100 arası tek bir skorda.
                </p>
                <div className="mt-8 flex flex-wrap gap-2.5">
                  <Link href="/register" className="btn btn--ai btn--lg">
                    <Sparkles size={16} /> Ücretsiz başla
                  </Link>
                  <Link href="/login" className="btn btn--outline btn--lg">
                    Giriş yap <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="mt-7 flex flex-wrap gap-6 text-[13px] text-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Shield size={14} /> KVKK uyumlu
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Github size={14} /> GitHub doğrulama
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check size={14} /> Kredi kartı yok
                  </span>
                </div>
              </div>

              <div className="relative grid h-[440px] place-items-center lg:h-[540px]">
                <AiOrb />
              </div>
            </div>
          </div>
        </section>

        {/* ============ LOGOS / TRUST ============ */}
        <section className="border-y border-border py-8">
          <div className="container-page">
            <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              Üniversite ve şirketlerde kullanılıyor
            </p>
            <div className="grid grid-cols-3 items-center gap-6 opacity-70 sm:grid-cols-6">
              {[
                "SDÜ",
                "ITU",
                "BOUN",
                "ODTÜ",
                "Acme",
                "Globex",
              ].map((name) => (
                <div
                  key={name}
                  className="text-center font-semibold text-text-2"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section id="features" className="py-24 lg:py-28">
          <div className="container-page">
            <div className="mb-16 max-w-2xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                Özellikler
              </span>
              <h2 className="mt-3 text-[clamp(30px,4vw,48px)] font-semibold tracking-[-0.035em]">
                Sadece <span className="ai-text">beyan</span> değil, kanıt.
              </h2>
              <p className="mt-4 text-text-2">
                Yetkinlik tahmin etmiyoruz — GitHub commit&apos;lerini, repo dillerini ve
                proje gerçekliğini AI ile karşılaştırıyoruz.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard
                accent
                icon={<Brain size={20} />}
                title="AI CV ayrıştırma"
                body="PDF veya DOCX yükle — kişisel bilgi, yetenek, deneyim, proje hepsi yapılandırılmış JSON&apos;a çevrilir."
              >
                <MiniSkillViz />
              </FeatureCard>
              <FeatureCard
                icon={<Github size={20} />}
                title="GitHub doğrulama"
                body="Public repo dilleri, commit frekansı, yıldız sayısı ve son aktivite ile beyan edilen yetkinlik karşılaştırılır."
              >
                <MiniCommitViz />
              </FeatureCard>
              <FeatureCard
                icon={<Target size={20} />}
                title="Akıllı ilan eşleştirme"
                body="CV&apos;ndeki gerçek yetkinliklerle iş ilanlarındaki gereksinimleri eşleştir — sana en uygun ilk 10 ilan."
              >
                <MiniMatchViz />
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how" className="border-t border-border py-24">
          <div className="container-page">
            <div className="mb-16 max-w-2xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                Nasıl çalışır
              </span>
              <h2 className="mt-3 text-[clamp(30px,4vw,48px)] font-semibold tracking-[-0.035em]">
                Üç adımda <span className="ai-text">gerçek skor</span>.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  num: "01",
                  title: "CV'ni yükle",
                  body: "PDF veya DOCX — AI dakikalar içinde yapılandırılmış veriye çevirir.",
                },
                {
                  num: "02",
                  title: "GitHub'ını bağla",
                  body: "Public profilin yeter. Public repo'larını, commit'lerini, dillerini tararız.",
                },
                {
                  num: "03",
                  title: "Skorunu al",
                  body: "Her yetkinlik için 0-100 puan, kanıt repo'ları ve tutarsızlık uyarıları.",
                },
              ].map((s) => (
                <div key={s.num} className="card card-hover">
                  <div className="mb-4 font-mono text-2xl text-text-muted">
                    {s.num}
                  </div>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-text-2">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PRICING TEASER ============ */}
        <section id="pricing" className="py-24">
          <div className="container-page">
            <div className="mb-12 text-center">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                Fiyatlandırma
              </span>
              <h2 className="mt-3 text-[clamp(30px,4vw,48px)] font-semibold tracking-[-0.035em]">
                Ücretsiz başla, hazır olunca <span className="ai-text">yükselt</span>.
              </h2>
            </div>

            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
              <PriceCard
                name="FREE"
                price="₺0"
                features={[
                  "Aylık 1 AI yetkinlik analizi",
                  "5 aktif başvuru",
                  "CV parse + GitHub bağlama",
                  "Topluluk desteği",
                ]}
                cta="Ücretsiz başla"
                href="/register"
              />
              <PriceCard
                name="PREMIUM"
                price="₺199"
                priceNote="/ay"
                accent
                features={[
                  "Sınırsız AI yetkinlik analizi",
                  "Sınırsız başvuru",
                  "PDF rapor indirme",
                  "Şirketlere Premium rozeti",
                  "Öncelikli destek",
                ]}
                cta="Premium'a yükselt"
                href="/register"
              />
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="py-24">
          <div className="container-page">
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border-strong bg-surface p-12 text-center lg:p-16">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(ellipse 50% 70% at 50% 50%, hsl(218 92% 62% / 0.5), transparent 70%)",
                }}
              />
              <div className="relative">
                <AiBadge>Bugün başla</AiBadge>
                <h2 className="mt-6 text-[clamp(28px,3.5vw,40px)] font-semibold tracking-[-0.035em]">
                  CV&apos;ndeki <span className="ai-text">gerçek hikâyeyi</span> ortaya çıkar.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-text-2">
                  Beş dakikada hesap aç, CV&apos;ni yükle, AI&apos;nın yetkinliklerini
                  doğrulamasını izle.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/register" className="btn btn--ai btn--lg">
                    <Sparkles size={16} /> Ücretsiz hesap aç
                  </Link>
                  <Link href="/login" className="btn btn--outline btn--lg">
                    Giriş yap
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border py-12">
        <div className="container-page flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md ai-grad">
              <Sparkles size={12} className="text-white" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
              © 2026 SYNAPSE
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            SDÜ Bitirme Projesi · Furkan Patat
          </p>
        </div>
      </footer>
    </>
  );
}

/* ============ Feature card ============ */
function FeatureCard({
  icon,
  title,
  body,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="card card-hover">
      <div
        className={`mb-5 grid h-11 w-11 place-items-center rounded-xl border ${
          accent
            ? "ai-grad border-transparent text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.5)]"
            : "border-border bg-surface-2 text-text"
        }`}
      >
        {icon}
      </div>
      <h3 className="text-[19px] font-semibold tracking-[-0.025em]">{title}</h3>
      <p className="mt-2 text-[14.5px] leading-[1.55] text-text-2">{body}</p>
      {children && (
        <div className="mt-5 h-[120px] overflow-hidden rounded-xl border border-border bg-bg-soft p-3.5">
          {children}
        </div>
      )}
    </div>
  );
}

function MiniSkillViz() {
  const skills = [
    { name: "React", val: 92, tone: "skill-bar__fill--high" },
    { name: "Node.js", val: 78, tone: "skill-bar__fill--high" },
    { name: "GraphQL", val: 42, tone: "skill-bar__fill--medium" },
    { name: "AWS", val: 28, tone: "skill-bar__fill--low" },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {skills.map((s) => (
        <div key={s.name} className="flex items-center gap-2.5 text-[11.5px] text-text-2">
          <span className="w-16">{s.name}</span>
          <div className="skill-bar__track flex-1">
            <div className={`skill-bar__fill ${s.tone}`} style={{ width: `${s.val}%` }} />
          </div>
          <span className="w-7 text-right font-mono text-text-muted">{s.val}</span>
        </div>
      ))}
    </div>
  );
}

function MiniCommitViz() {
  return (
    <div className="grid h-full grid-cols-13 gap-[3px]">
      {Array.from({ length: 7 * 13 }).map((_, i) => {
        const intensity = Math.random();
        const opacity =
          intensity > 0.8 ? 1 : intensity > 0.55 ? 0.7 : intensity > 0.3 ? 0.4 : 0.15;
        return (
          <span
            key={i}
            className="rounded-sm"
            style={{
              background: "var(--ai-2)",
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}

function MiniMatchViz() {
  return (
    <div className="flex h-full items-center justify-center gap-3">
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Match
        </div>
        <div className="mt-1 text-3xl font-semibold ai-text">94%</div>
      </div>
      <FileText size={28} className="text-text-muted" />
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Skill
        </div>
        <div className="mt-1 text-3xl font-semibold">7/8</div>
      </div>
    </div>
  );
}

/* ============ Price card ============ */
function PriceCard({
  name,
  price,
  priceNote,
  features,
  accent,
  cta,
  href,
}: {
  name: string;
  price: string;
  priceNote?: string;
  features: string[];
  accent?: boolean;
  cta: string;
  href: string;
}) {
  return (
    <div
      className={`relative rounded-[var(--radius-lg)] border p-8 ${
        accent
          ? "border-transparent ai-pulse"
          : "border-border bg-surface"
      }`}
      style={
        accent
          ? {
              background:
                "linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(110deg, hsl(280 88% 67%), hsl(218 92% 62%), hsl(190 85% 56%)) border-box",
              borderWidth: 2,
            }
          : undefined
      }
    >
      {accent && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <span className="pill pill--ai" style={{ fontSize: 11 }}>
            <Sparkles size={11} /> Tavsiye edilen
          </span>
        </div>
      )}
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        {name}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tightest">{price}</span>
        {priceNote && <span className="text-text-muted">{priceNote}</span>}
      </div>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check
              size={16}
              className={accent ? "text-ai-3 mt-0.5 shrink-0" : "text-text-muted mt-0.5 shrink-0"}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`btn btn--lg mt-8 w-full ${accent ? "btn--ai" : "btn--outline"}`}
      >
        {cta}
      </Link>
    </div>
  );
}
