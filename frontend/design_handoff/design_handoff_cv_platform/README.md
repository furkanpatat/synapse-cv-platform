# CV Platform — UI Redesign Handoff

> **Codename:** Synapse
> **Stack hedef:** Next.js 14 (App Router) + TailwindCSS + TypeScript + Zustand + react-hook-form + zod + Framer Motion (motion/react) + lucide-react
> **Repo:** `/Users/furkanpatat/Desktop/cv-platform/frontend`

---

## 1. Bu paket ne içerir, ne değildir

`designs/` klasöründeki HTML/CSS/JSX dosyaları **canlı, etkileşimli tasarım referanslarıdır** — Babel-in-the-browser ile çalışan, gerçek motion içeren hi-fi prototiplerdir. **Üretim kodu değildir**; doğrudan kopyalanmaz.

Görevin: bu prototipleri Next.js 14 App Router yapısında **pixel-perfect** olarak yeniden inşa etmek. Stack zaten belli (Tailwind + TS + Framer Motion + lucide-react). API endpoint'lerini, type'ları (`src/types/*.ts`), `*-api.ts` dosyalarını **değiştirme** — sadece JSX + className + animasyon ekle.

**Fidelity:** Hi-fi. Renkler, tipografi, spacing ve etkileşimler final. Birebir uygula.

---

## 2. Sistemi sindir — başlamadan oku

`designs/landing/landing.css` → tüm CSS değişkenleri ve tema sistemi burada. Diğer sayfalar bu dosyayı paylaşıyor.
`designs/landing/primitives.jsx` → `Icon`, `Button`, `Field`, `Tag`, `ThemeToggle` primitives.
`designs/landing/tweaks-panel.jsx` → Tweak panel altyapısı (production'da gerekmiyor).

### Renk paleti (CSS custom properties)

```css
/* Dark (default) */
--bg:              #08090c;
--surface:         #111317;
--surface-2:       #1a1d23;
--surface-3:       #23272f;
--border:          #23262d;
--border-strong:   #2f3440;
--text:            #f5f6f8;
--text-2:          #a3a8b3;
--text-muted:      #6b7180;

/* Light */
--bg:              #fafaf9;
--surface:         #ffffff;
--surface-2:       #f4f4f3;
--surface-3:       #eceae6;
--border:          #e6e5e2;
--border-strong:   #d6d3cf;
--text:            #14151a;
--text-2:          #525762;
--text-muted:      #8a8f9b;

/* Status */
--success:  #22c55e;   /* HIGH confidence */
--warning:  #f59e0b;   /* MEDIUM confidence */
--danger:   #ef4444;   /* tutarsızlık */
--info:     #3b82f6;
```

### AI gradient sistemi

Bu projenin **kalbi**. Her yerde aynı gradient kullanılıyor — mor → mavi → cyan.

```css
/* AI gradient — kanonik üç durak */
background: linear-gradient(135deg,
  hsl(280 88% 67%),   /* purple-500 ekvivalanı */
  hsl(218 92% 62%),   /* blue-500 */
  hsl(190 85% 56%)    /* cyan-400 */
);

/* Tailwind ifadesi */
bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400
```

İki adet runtime CSS var.
- `--ai-intensity` (0.2–1.2): tüm AI glow/gradient yoğunluğunu çarpar
- `--ai-hue` (-60 to 120, derece): renk tonunu kaydırır

Production'da `aiIntensity = 1.0`, `aiHue = 0` kullan; tweak panelini at.

### Tipografi

```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

- **Sans:** Geist (weights 300/400/500/600/700/800)
- **Mono:** Geist Mono (UPPERCASE eyebrows, badges, timestamps)
- **Body:** 14.5–15px, letter-spacing: -0.01em
- **Headings:** `letter-spacing: -0.035em` (büyük başlıklarda -0.045em)
- **`text-wrap: pretty`** başlıklarda kullanılıyor

Headings'de "vurgu kelimesi" için **`.ai-text`** class'ı — AI gradient ile background-clip:text uygulanmış metin. Örnek: "CV'nin gerçekliğini <span class="ai-text">AI ile</span> doğrula".

### Spacing & Radius

```css
--radius-sm: 8px;
--radius:    12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
```

Layout container max-width: **1240px**, padding 0 32px (mobil 0 20px).
Bölümler arası dikey ritm: **96px–128px**.

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
--shadow:    0 4px 16px -4px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.05);
--shadow-lg: 0 24px 48px -12px rgba(0,0,0,0.15), 0 8px 16px -6px rgba(0,0,0,0.08);

/* AI glow — gradient'le pulse'lanan kartlar */
--ai-glow: 0 0 0 1px rgba(139,92,246,0.35),
           0 8px 32px -8px rgba(59,130,246,0.45),
           0 16px 64px -16px rgba(34,211,238,0.30);
```

---

## 3. Ortak komponent envanteri

Production'a önce **bu primitives'leri** çıkar (`src/components/ui/` altına):

| Komponent | Açıklama | Kullanım |
|---|---|---|
| `Button` | `variant`: `primary` \| `ai` \| `outline` \| `ghost`; `size`: `sm` \| `md` \| `lg`. `ai` = gradient + glow + sparkle hover pulse. | Her yerde |
| `Field` | Label (mono UPPERCASE) + input/select/textarea + opsiyonel icon prefix + error state. | Tüm formlar |
| `Tag` / `Chip` | Skill tags; `tone`: `default` \| `success` \| `warning` \| `danger` \| `ai`. | Skill list, status |
| `Icon.*` | lucide-react wrapper. Geçerli: `Sparkles, Wand2, Github, Mail, Lock, Eye, User, Building2, Briefcase, FileText, MessageSquare, Bell, Search, Filter, Check, X, ChevronDown/Right, MapPin, DollarSign, Clock, TrendingUp, Star, Zap, Brain`. | UI'da heryerde |
| `ThemeToggle` | Sun/Moon ikon, `html[data-theme]` günceller, localStorage'a yazar. | Top nav |
| `AiBadge` | "✨ AI tarafından analiz edildi" rozet — gradient border, mini sparkle. **Brief'te isim ile istendi** (`src/components/AiBadge.tsx`). | Tüm AI çıktılarında |
| `QuotaBanner` | Sticky uyarı şeridi — kalan kontenjan + Premium CTA. | Dashboard üstü |
| `ScoreRing` | Dairesel conic-gradient progress (0–100). 3 boyut: `sm` (48px), `md` (96px), `xl` (260px hero). | Analysis, dashboard widget, job apply card |
| `SkillBar` | İsim + bar + yüzde + confidence label. HIGH=yeşil glow, MEDIUM=amber, LOW=gri. | Analysis, job detay |
| `SidebarNav` | Role-aware (USER/COMPANY/ADMIN). Aktif item'de soldan gradient bar + "AI" rozeti AI Analiz item'inde. | Tüm panel layout'ları |

### `Button` varyantları

```tsx
// AI buton (ana CTA)
<button className="btn btn--ai btn--lg">
  <Sparkles size={14} /> Hesabımı oluştur
</button>

/* gradient: linear-gradient(135deg, #a855f7, #3b82f6, #22d3ee)
   shadow:   0 8px 24px -8px rgba(59,130,246,.45)
   hover:    transform: translateY(-1px) + brightness(1.08)
   active:   translateY(0) + brightness(0.95)
   focus:    outline: 2px solid hsl(218 92% 62%); outline-offset: 2px;  */
```

Detaylar için `designs/landing/landing.css` içindeki `.btn` ailesine bak.

### Field (input)

```tsx
<label className="field">
  <span className="field__label">E-POSTA</span>  {/* mono, 11px, uppercase, letter-spacing 0.16em */}
  <div className="field__wrap">
    <Mail className="field__icon" />              {/* opsiyonel */}
    <input type="email" placeholder="..." />
  </div>
</label>
```

`background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;`
Focus state: `border-color: var(--text); box-shadow: 0 0 0 3px rgba(255,255,255,0.04);`
Icon prefix: `padding-left: 38px`, icon `position: absolute; left: 12px;`.

---

## 4. Ekran ekran detay

Her ekran tek bir HTML dosyasında ama **birden fazla sayfayı barındırıyor** (sağ üstte page-toggle var). Production'da her sayfa kendi route'unda olacak.

### 4.1 Landing — `designs/landing/Landing.html`

**Route:** `src/app/page.tsx`

**Bölümler (yukarıdan aşağıya):**

1. **Sticky nav** — Synapse logo (32px gradient mark) + nav linkler (Özellikler / Fiyatlandırma / Şirketler) + ThemeToggle + "Giriş yap" outline + "Ücretsiz başla" AI button.
   - `position: sticky; top: 0;` `backdrop-filter: blur(12px);` `background: hsla(var(--bg), 0.7);`
2. **Hero** — sol metin / sağ AI orb.
   - Eyebrow: `<Sparkles /> AI · v2 · YENİ` (mono pill)
   - H1: 72px, `letter-spacing: -0.045em`, `text-wrap: pretty`. "AI ile" gradient.
   - Sub: 18px, `var(--text-2)`, max-width 540px.
   - CTA çifti: "Ücretsiz analizini al" (ai, lg) + "Demo izle" (outline, lg)
   - Trust strip: 3 logo placeholder + "Bin kişi tarafından kullanılıyor"
   - Sağda canlı AI orb: 3 katlı dönen ring + breathing core + 8 twinkle spark. CSS keyframes: `orb-spin 18s/26s/14s linear infinite`, `core-breathe 4s ease-in-out infinite`.
3. **Live AI önizleme kartı** — viewport'a girince:
   - Skill bar'ları stagger ile dolar (her biri 80ms gecikme)
   - AI summary "typing" reveal (16ms'de 2 karakter)
   - `IntersectionObserver` ile tetikle.
4. **3 özellik kartı** — AI Parse (mini skill bars) / GitHub Verify (commit graph) / Job Match (match ring).
5. **3 adımlı akış** — numbered, gradient connecting line.
6. **Plan vurgusu** — premium plan gradient border + "Tavsiye edilen" rozet.
7. **CTA bandı** — büyük gradient surface + AI button.
8. **Footer** — 4 kolon link + alt mono "© 2026 SYNAPSE".

### 4.2 Login + Register + Verify — `designs/auth/Auth.html`

**Routes:**
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/verify-email/page.tsx`

**Split-screen** (`grid-template-columns: 1fr 1fr;`). `@media (max-width: 980px)` → sol panel gizlenir (`display: none`), form full-width.

**Sol dekoratif panel:**
- Synapse brand mark
- Merkez: AI orb (landing'deki ile aynı motion)
- Alt: müşteri quote (her sayfaya farklı): metin + avatar (gradient circle, initials) + isim + rol mono
- Arkaplan: 3 radial gradient cloud (purple, blue, cyan) + grid pattern (56px × 56px, opacity 0.045) + radial vignette mask

**Sağ form pane:**
- En fazla 440px genişlik, dikey ortalı
- Top: ThemeToggle (sağ üst)
- Eyebrow + H1 (28–36px, "vurgu kelimesi" `.ai-text` ile)
- **Social butonlar** (Google + GitHub, eşit grid 2 kolon, outline)
- "YA DA" divider — mono, iki yanında 1px line
- **Form** — Field'lar, gap 14px

**Login özel:**
- Email + Password (eye toggle)
- "Beni hatırla" gradient checkbox + "Şifremi unuttum" link
- AI CTA "Giriş yap"
- Alt: "Hesabın yok mu? Hemen kayıt ol"

**Register özel:**
- **Birey / Şirket** segmented switcher (üstte, 12px radius pill, aktif tab gradient brightness)
- Birey alanları: Ad / Soyad / Email / Password
- Şirket alanları: Şirket adı / Website / Çalışan select (1–10 / 11–50 / 51–200 / 200+) / İş email / Password
- **Password strength meter** — 4 bar, harf sayısı / 3'e göre dolar; etiket: "—/Zayıf/Orta/İyi/Güçlü"
- KVKK checkbox + "Kullanım koşulları" + "gizlilik politikası" linkleri
- AI CTA: kind'a göre "Hesabımı oluştur" / "Şirket hesabını oluştur"

**Verify özel:**
- Centered card (max 460px), gradient 4px border outer, surface inner
- Üstte gradient orb (84px, mail icon) — `verify-pulse 2.4s` ile dış halka genişler+fade
- Email chip (mono surface-2)
- 2 CTA: "Gelen kutusuna git" (ai) + "Farklı e-posta kullan" (outline)
- "Tekrar gönder (00:42)" countdown link

### 4.3 USER Dashboard — `designs/dashboard/Dashboard.html` (USER görünümü)

**Route:** `src/app/(user)/dashboard/page.tsx` + `src/app/(user)/dashboard/layout.tsx`

**Layout:**
- Sol sidebar (240px, sticky, lg+) — Logo, nav items (Genel, CV, **AI Analiz** gradient indicator + "AI" rozet, İlanlar, Başvurularım, Mesajlar, Profil, Abonelik), alt avatar dropdown.
- Mobilde hamburger → drawer.
- Top bar: page title + arama + bildirim + theme toggle + avatar.

**Page içeriği:**
1. **Welcome hero** — "Merhaba Ahmet 👋" (büyük başlık, vurgu kelime gradient) + sub. Sağda **AI skor widget**: 96px ring (87/100), 4 mini metrik (Yetkinlik/Github/Tutarlılık/Güven), +4 delta yeşil pill.
2. **6 quick-action grid** (3×2, gap 16px) — CV / AI Analiz / İlanlar / Başvurularım / Mesajlar / Profil. AI Analiz kartı gradient ikonla vurgulu, diğerleri hover'da gradient outline + `transform: translateY(-2px)`.
3. **Önerilen ilanlar** (3 kart) — mini match ring + şirket logo + skill tags.
4. **Başvuru timeline** — vertical, renkli durum noktaları (Pending=amber, Reviewing=blue, Accepted=green, Rejected=red), tarih + status badge + AI skor mini.

### 4.4 COMPANY Dashboard — `designs/dashboard/Dashboard.html` (COMPANY görünümü)

**Route:** `src/app/(company)/company/page.tsx`

Aynı shell, farklı sidebar (İlanlarım / Başvurular / **AI Sıralama** gradient / Mesajlar / Şirket profili / Faturalandırma).

**Page içeriği:**
1. **Welcome hero** + havuz sağlığı widget (4 aktif ilan, 78 ortalama skor, 12 gün time-to-hire).
2. **4 stat tile** (gap 16px) — Aktif ilan / Toplam başvuru / Yüksek skor / Görüntülenme. Her birinde sparkline (12 nokta SVG path) + delta pill.
3. **Aktif ilanlar tablosu** — başlık, başvuru sayısı, "YAYINDA" pulse rozet, "Detay" link.
4. **AI sıralı top adaylar** — 5 kart, gradient skor rozeti (92→64 azalan sıralı), avatar + isim + rol + skill tags.
5. **Aktivite feed** — son 24 saat (yeni başvuru, mesaj, view, vb.) — timestamp mono.

### 4.5 Analysis — `designs/analysis/Analysis.html`

**Route:** `src/app/(user)/dashboard/analysis/page.tsx`

**3 durum** (component state `'empty' | 'loading' | 'result'`):

**Empty:**
- Dashboard layout (sidebar + ana)
- Merkezde gradient orb (96px) + H1 "İlk AI analizini başlat" + sub + AI CTA "<Sparkles /> Analizi başlat" + bullet listesi (GitHub bağlı / CV yüklü / Plan: FREE × 3 hak)

**Loading:**
- 200px rotating AI orb (3 ring + core breathe)
- Canlı adım metni — `['CV verilerini okuyorum...', 'GitHub commit geçmişini analiz ediyorum...', 'Yetkinlik haritası çıkarılıyor...', 'Tutarsızlıklar denetleniyor...', 'Skor hesaplanıyor...']` arasında 2.4 saniyede geçiş (fade)
- Shimmer progress bar altında

**Result** — ⭐ Yıldız sayfa:

1. **Skor Hero** — büyük kompozisyon:
   - Sol: 260px conic-gradient progress ring (`background: conic-gradient(from -90deg, hsl(280...) 0%, hsl(218...) 50%, hsl(190...) ${score}%, var(--surface-2) ${score}% 100%)`). İçinde merkezde "87 / 100" sayısı (font-size 72px, font-weight 600, letter-spacing -0.04em). Dış 2px ring slow rotate. Glow pulse 3s.
   - Sağ: "GÜÇLÜ ADAY" gradient rozet → büyük başlık → 4 pillar mini bar (Yetkinlik 92 / GitHub kanıtı 85 / Tutarlılık 78 / Güven 94). Mount'ta stagger fade-up.
2. **AI Özeti** — kart, eyebrow `<Sparkles /> AI ÖZETİ`. 3–4 paragraf metin, **typing reveal** (her 16ms'de 2 karakter). Bitince alta doğrulama pill'leri (✓ 14 yetkinlik / ✓ GitHub verisi / ⚠ 2 tutarsızlık).
3. **Yetkinlik dökümü** — 3 kategori (Frontend / Backend / Cloud) accordion. Açıkken: her skill için `<SkillBar>` — isim, bar (stagger fill on mount), yüzde, HIGH (yeşil glow) / MEDIUM (amber) / LOW (gri) confidence label.
4. **Tutarsızlıklar** — accordion item'lar, kırmızı pulse halkalı icon. Açıkken: 3 satır (BEYAN / KANIT / ÖNERİ) farklı renkli pill'lerle.
5. **GitHub Kanıtı** — 4-grid:
   - Commit sayısı (mono büyük) + trend sparkline
   - Dil dağılımı segmented bar (TypeScript 42% / JS 28% / Python 18% / Go 12%) + legend
   - 26 haftalık katkı takvimi (7×26 grid, hücre 12px, GitHub-stili 5 yoğunluk tonu) — mount'ta sıralı reveal (her sütun 30ms)
   - Top 3 repo kartı: name, dil dot, star count, son commit tarihi mono

### 4.6 Jobs list + detail + Profile — `designs/jobs/Jobs.html`

**Routes:**
- `src/app/(user)/dashboard/jobs/page.tsx`
- `src/app/(user)/dashboard/jobs/[id]/page.tsx`
- `src/app/(user)/dashboard/profile/page.tsx`

**Jobs list:**
- **Sticky filter bar** — arama (icon prefix) + Konum select + Deneyim select + Sıralama select + skill chip toggle satırı (React, Node.js, Python, AWS, Docker, GraphQL, vb.). `position: sticky; top: 0;` `backdrop-filter: blur(12px);`
- **"AI sana özel önerdi" yatay carousel** — 3 kart, gradient glow border, `brightness-pulse 3s infinite`. Sağa scroll için snap.
- **Ana grid** — 2 kolon kart, 8 item. Her kart:
  - Şirket logo (40px, rounded)
  - Rol + şirket adı
  - Sağ üst: AI %match mini-ring (48px)
  - Konum pill + Maaş pill + Full-time pill
  - Skill tags (max 4)
  - "Detay" + "Kaydet" ikon

**Job detail:**
- Geri butonu (chevron + "İlanlar")
- Hero: şirket logo (64px) + rol + chip satırı (konum/maaş/full-time/yayın tarihi) + sağda Kaydet/Paylaş butonları
- 2-kolon grid (1.6fr / 1fr):
  - **Sol:** açıklama markdown-stili — h2/h3, paragraf, bullet'lar, **check-list** (Rol / Sorumluluklar / Aranan profil / Tech stack / Sunduklarımız).
  - **Sağ sticky apply card** (`position: sticky; top: 24px;`):
    - Gradient 2px border + AI brightness pulse
    - "Bu İlana Uygunluğun" + 120px animated %92 ring (mount'ta 0→92 ease-out 1.2s)
    - Skill comparison tablosu — 2 kolon: İlan ne istiyor / Sen ne biliyorsun (✓ veya —)
    - "Hemen başvur" AI CTA full-width
    - "AI ile öne çıkar" outline button (Premium gate)
    - Mini: "Şirket detayları" link

**Profile:**
- Gradient cover banner (180px) + avatar (128px, banner'a -50% overlap, white border + edit icon)
- 2-kolon (2fr / 1fr):
  - **Sol:** Kişisel bilgiler (form), Hakkımda (textarea + "AI ile yaz" outline button + sparkle), Sosyal linkler (GitHub satırında **DOĞRULANDI** yeşil rozet), Beceriler (skill chip ekleme/silme)
  - **Sağ sticky:** %76 completion kartı (animated bar + todo listesi check-state), GitHub durumu (last sync mono), Profil görünürlüğü toggle

### 4.7 Billing — `designs/billing/Billing.html`

**Route:** `src/app/(user)/dashboard/billing/page.tsx`

Toggle: FREE / PREMIUM görünümü (production'da Zustand store'dan alınır).

1. **Plan hero** — 2 kolon:
   - **Sol kart:** mevcut plan rozet (FREE outline gri / PREMIUM gradient border + brightness pulse), büyük başlık, açıklama, "Planı yönet" link
   - **Sağ sticky panel:** Sonraki fatura (tarih + tutar mono büyük) / Yenileme durumu / Ödeme yöntemi (kart son 4 hane)
2. **Bu ay kullanımın** — 3 animated usage bar:
   - AI analiz: 1/3 (FREE) veya ∞ (PREMIUM, "∞" gradient rozet ile)
   - Başvuru: 8/15 (FREE) veya ∞ (PREMIUM)
   - Mesaj: 47/100 (FREE) veya ∞ (PREMIUM)
   - Bar dolum rengi yüzdeye göre: <60% yeşil, 60–85% amber, >85% kırmızı. Animasyon: mount'ta 0→değer 1.2s ease-out.
3. **Plan compare tablosu** — 3 kolon (Free / **Premium** / Pro). Premium kolon:
   - 2px gradient border
   - `brightness-pulse 3s` glow
   - Tepesinde "TAVSİYE EDİLEN" gradient pill rozet (`translate(-50%, -50%)`)
   - `transform: translateY(-8px)` öne çıkarılmış
   - Her plan altında 7 özellik listesi ✓ (yeşil) veya × (gri) ile.
4. **Aylık / Yıllık toggle** (sağ üst) — yıllık seçilince fiyatlar değişir + "−%25" yeşil pill.
5. **CTA satırı** — aktif plansa "Aktif plan" disabled pill, diğerleri "Aylık ₺199 ile yükselt" AI button + pulse.
6. **Premium özellikleri** — 4 tile grid (gap 16px):
   - Sınırsız AI analizi (sparkle ikon)
   - AI ile öne çıkar (wand ikon)
   - Akıllı eşleşme (brain ikon)
   - Öncelikli destek (zap ikon)
7. **Alt 2-kolon** (gap 24px):
   - **Fatura geçmişi** — PREMIUM'da 3 satır (tarih mono / açıklama / tutar / PDF indir icon-button); FREE'de empty state ("Henüz fatura yok")
   - **FAQ** — 5 expand/collapse item (`max-height` transition 240ms ease-out)

---

## 5. Animasyon spesifikasyonları

| İsim | Trigger | Süre/Easing | Detay |
|---|---|---|---|
| Page enter | Route mount | 400ms ease-out | Tüm sayfada `opacity 0→1`, `translateY 12→0` (parent), child'lar `stagger 60ms` |
| AI orb | Always | 18s/26s/14s linear infinite | 3 ring opposite directions, ring-3 hızlı |
| Orb core | Always | 4s ease-in-out infinite | `scale 1→1.04`, `brightness 1→1.15` |
| Twinkle spark | Always | 3s ease-in-out infinite, random delay | `opacity 0.2→1`, `scale 0.6→1.2` |
| Card hover lift | Hover | 180ms ease-out | `translateY(-2px)`, `box-shadow lg` |
| AI CTA hover | Hover | 140ms ease-out | `translateY(-1px)`, `brightness 1.08` |
| Skill bar fill | IntersectionObserver | 800ms ease-out, stagger 80ms | `width 0→%` |
| Typing reveal | Visible | 16ms per 2 chars | Char-by-char |
| Shimmer (skeleton) | Loading | 1.6s linear infinite | Translate gradient |
| AI brightness pulse | Premium card / AI carousel | 3s ease-in-out infinite | `filter: brightness(1)↔brightness(1.06)` + `box-shadow` glow ralenti |
| Verify pulse | Verify page orb | 2.4s ease-out infinite | `scale 1→1.6`, `opacity 0.7→0` |
| Status pulse (red) | Tutarsızlık icon | 2s ease-out infinite | Ring expand+fade |
| GitHub graph reveal | Mount | per-column 30ms cascade | `opacity 0→1`, `scale 0.5→1` |
| Score ring fill | Mount | 1.2s ease-out | `conic-gradient` mask transition |
| Message bubble in | New msg | 240ms ease-out | `translateY(8)→0`, `opacity 0→1` |
| Theme toggle | Click | 280ms ease | `html[data-theme]` swap, CSS vars geçer |

**Framer Motion karşılığı:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
  // stagger: parent <motion.div variants={{...}} initial="hidden" animate="show">
  //   <motion.div variants={{ hidden: {opacity:0,y:12}, show: {opacity:1,y:0} }} />
/>
```

`prefers-reduced-motion: reduce` query'de tüm `infinite` animasyonları durdur, transition'ları 0ms yap.

---

## 6. State management notları

- **Theme:** `html[data-theme="dark|light"]`. localStorage'a yaz, ilk render'da SSR-safe oku (cookie ile veya `<script>` head'inde inline okuma).
- **Auth:** Zustand auth store (zaten var) — `user`, `role` (`USER` | `COMPANY` | `ADMIN`), `token`. Persist enabled.
- **Analysis:** local state `'empty' | 'loading' | 'result'`. Loading'de step'leri timer ile geç. Result, API'den `AnalysisResult` type'ı.
- **Tweaks panel:** **production'a dahil etme**. Sadece prototip preview için.
- **AI gradient runtime:** production'da fixed (Tailwind config'e `--ai-intensity` ve `--ai-hue` ekleme); design'da CSS var. Tailwind'de:
  ```ts
  // tailwind.config.ts → extend.colors
  brand: { primary: '#2563eb', ... },
  ai: { from: '#a855f7', via: '#3b82f6', to: '#22d3ee' }
  // util class:
  // .ai-gradient { @apply bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400; }
  ```

---

## 7. Responsive

Mobile-first. Breakpoint'ler (Tailwind default):
- `sm: 640px`
- `md: 768px`  → split-screen auth burada katlanır (designs `980px` kullanıyor; sen `md` veya `lg` kullan)
- `lg: 1024px` → sidebar burada açılır; mobilde hamburger drawer
- `xl: 1280px` → layout max-width

Sidebar mobilde: hamburger trigger top bar'da; drawer left'ten slide-in (Framer Motion).
Tablolar mobilde: yatay scroll veya card list'e collapse.

---

## 8. Erişilebilirlik kontrol listesi

- [ ] Tüm interaktif öğelerde `:focus-visible` outline (2px var(--text) outline + 2px offset)
- [ ] Form input'larda `<label>` bağlı
- [ ] Icon-only butonlarda `aria-label`
- [ ] AI gradient text'lerde **fallback color** (`background-clip:text` desteklemeyen tarayıcılar için var(--text))
- [ ] Renk + ikon birlikte kullan (sadece renk değil — HIGH/MEDIUM/LOW'da)
- [ ] `prefers-reduced-motion` desteği
- [ ] Skip link "İçeriğe atla"
- [ ] Dark/light kontrast: WCAG AA — text vs surface ≥ 4.5:1

---

## 9. Dosya envanteri

`designs/` altında:

| Dosya | İçerik |
|---|---|
| `landing/Landing.html` + `landing.css` + `landing.jsx` + `orb.jsx` + `primitives.jsx` + `sections.jsx` + `tweaks-panel.jsx` | Landing + tüm shared primitives. **Bu CSS dosyası tüm projenin tema sistemini barındırıyor — başla buradan.** |
| `auth/Auth.html` + `auth.css` + `auth.jsx` | Login, register (USER/COMPANY tab), verify-email |
| `dashboard/Dashboard.html` + `dashboard.css` + `dashboard.jsx` | USER ve COMPANY dashboard'u (toggle ile) — sidebar shell de burada |
| `analysis/Analysis.html` + `analysis.css` + `analysis.jsx` + `panels.jsx` + `shell.jsx` + `icons-extra.jsx` | AI analiz sayfası — empty / loading / result |
| `jobs/Jobs.html` + `jobs.css` + `jobs.jsx` | İlan listesi, ilan detayı, profil sayfası |
| `billing/Billing.html` + `billing.css` + `billing.jsx` | Abonelik / fatura sayfası |

**Açma:** Her HTML dosyasını tarayıcıda aç. Sağ üstte page toggle var (Login/Register/Verify gibi) — farklı durumları gez. Toolbar'dan **Tweaks** açılırsa tema/AI yoğunluğu/hue ayarlanabilir.

---

## 10. Eksik kalan ekranlar (sonra ele alınacak)

Bu paket landing + auth + dashboard + analysis + jobs + profile + billing'i kapsıyor. **Aşağıdakiler henüz tasarlanmadı** — design tekrar dön:

- CV upload + parse sonucu (`/dashboard/cv`)
- Başvurularım (`/dashboard/applications`) — timeline/grid kart
- Mesajlaşma (chat 2-pane, hem USER hem COMPANY)
- Aday detayı (`/company/applications/[id]`)
- ADMIN paneli (3 sayfa: dashboard / users / companies)
- Yeni ilan oluştur (`/company/jobs/new`)

Bu paketin sistemini (renk, type, primitive'ler, animasyon dili) kalan sayfalar için **harfiyen** uygula. Yeni komponent gerekirse `src/components/ui/` altına ekle, isimlendirme ve API'yi mevcutlarla tutarlı tut.

---

## 11. Kurallar (brief'ten — değiştirme)

- ✅ API endpoint'lerini ve type'ları (`src/types/*.ts`, `src/lib/*-api.ts`) değiştirme
- ✅ Mevcut sayfa fonksiyonlarını koru (Zustand, react-hook-form, axios)
- ✅ Sadece JSX + className + animasyon ekle
- ✅ Mobile-first, `lg:` breakpoint'lerde sidebar
- ✅ shadcn/ui kullanılabilir (`npx shadcn@latest init`)
- ✅ Framer Motion (`motion/react`) ekle
- ✅ lucide-react zaten var
- ❌ TypeScript hatası verme (`npm run typecheck` geçmeli)
- ❌ Mevcut Tailwind config'i kırma; sadece `extend` et

İyi şanslar 🚀
