# Production Deployment Guide

Synapse'i gerçek bir sunucu / Kubernetes cluster'ında ayağa kaldırmak için
gereken adımlar — kod tarafında **Phase 0** bittiği varsayılıyor.

> Bu dosya hem deploy çalıştıran operatöre hem de tezde "üretim ortamına
> hazır" iddiasını destekleyen evrak olarak yazılmıştır.

---

## 0. Önkoşul kontrolü

Bu dosyaya gelmeden önce:

- [ ] `infra/k8s/` manifestlerini incelemiş ol
- [ ] DNS A record'larını yapı (örn. `synapse.example.com → cluster IP`)
- [ ] cert-manager + ingress-nginx cluster'da kurulu
- [ ] SealedSecrets controller cluster'da kurulu (gerçek secret'ları git'e koymak için)
- [ ] GHCR'a push iznin var (`packages: write`)
- [ ] Iyzico merchant hesabı **production** moda geçirildi
- [ ] Google + GitHub OAuth app'leri **production callback** URL'siyle güncellendi
- [ ] SMTP sağlayıcı seçildi (SendGrid, AWS SES, Mailgun, Postmark)

---

## 1. Secret üretimi

### 1.1 JWT secret
```bash
openssl rand -base64 48
# → ortaya 64 karakterlik bir string çıkar. Bunu JWT_SECRET olarak kullan.
```

### 1.2 DB / cache / queue parolaları
Her biri için ayrı 32+ karakterlik random string:
```bash
for n in POSTGRES MONGO REDIS RABBITMQ MINIO_ROOT; do
  echo "${n}_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
done
```

### 1.3 Admin bootstrap parolası
```bash
openssl rand -base64 24
# En az 16 karakter olmalı — application.yml'deki guard kısa parolayı reddeder.
```

### 1.4 Bunları K8s'e ulaştırma
**Önerilen:** [SealedSecrets](https://github.com/bitnami-labs/sealed-secrets) ile şifrele, git'e commit et:
```bash
cp infra/k8s/02-secrets.example.yaml /tmp/02-secrets.yaml
# /tmp/02-secrets.yaml dosyasını gerçek değerlerle doldur
kubeseal -f /tmp/02-secrets.yaml -w infra/k8s/02-secrets.sealed.yaml
git add infra/k8s/02-secrets.sealed.yaml && git commit -m "infra: prod secrets (sealed)"
rm /tmp/02-secrets.yaml      # plain ekranda kalmasın
```

> 💡 SealedSecrets kullanmıyorsan, dosyayı git'e KOYMA. K8s cluster'a doğrudan
> `kubectl apply -f /tmp/02-secrets.yaml` ile push et, sonra sil.

---

## 2. SMTP (gerçek e-posta)

Dev'deki MailHog yerine gerçek bir sağlayıcı şart — yoksa kullanıcı kayıt
doğrulama / şifre sıfırlama / mülakat daveti maillerini alamaz.

### 2.1 SendGrid (en kolay)
1. [sendgrid.com](https://sendgrid.com) → API Key oluştur
2. K8s secret olarak ekle:
   ```yaml
   SMTP_HOST: smtp.sendgrid.net
   SMTP_PORT: "587"
   SMTP_USERNAME: apikey
   SMTP_PASSWORD: <SG_API_KEY>
   MAIL_FROM: noreply@synapse.example.com   # Sender Authentication'tan onaylanmış
   ```

### 2.2 AWS SES
1. AWS console → SES → Verified identity (domain) → SPF/DKIM kayıtları
2. SMTP credentials oluştur
3. Aynı format, sadece host:
   ```yaml
   SMTP_HOST: email-smtp.eu-west-1.amazonaws.com
   ```

### 2.3 Mailgun / Postmark
Benzer — sadece host + credential farklı.

---

## 3. DNS + TLS

### 3.1 DNS
| Subdomain | Tip | Hedef |
|---|---|---|
| `synapse.example.com` | A | cluster ingress IP |
| `api.synapse.example.com` | A | cluster ingress IP |

### 3.2 cert-manager ClusterIssuer
```yaml
# bir kere uygula
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata: { name: letsencrypt-prod }
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@example.com
    privateKeySecretRef: { name: letsencrypt-prod }
    solvers:
      - http01:
          ingress: { ingressClassName: nginx }
```

`infra/k8s/30-ingress.yaml` zaten `cert-manager.io/cluster-issuer: letsencrypt-prod`
annotation'ı taşıyor — ingress apply edilince sertifika otomatik gelir.

---

## 4. OAuth provider güncellemesi

### Google
1. https://console.cloud.google.com/apis/credentials
2. OAuth 2.0 Client ID → "Authorized redirect URIs"
3. Mevcut `http://localhost:8080/...` yerine **`https://api.synapse.example.com/api/v1/auth/oauth/google/callback`** ekle (dev kayıtı silebilirsin)

### GitHub
1. https://github.com/settings/developers → OAuth App
2. Authorization callback URL → **`https://api.synapse.example.com/api/v1/auth/oauth/github/callback`**

> ⚠️ Bu URL'leri secret'lara yansıt: `GOOGLE_REDIRECT_URI`, `GITHUB_REDIRECT_URI`.
> Backend de aynı string'i Google'a/GitHub'a gönderiyor — eşleşmezse 400.

---

## 5. Iyzico production swap

1. Iyzico merchant panelinden **Production API Key** + **Secret** al
2. Secret'lara yansıt:
   ```yaml
   IYZICO_API_KEY: <prod-key>
   IYZICO_SECRET_KEY: <prod-secret>
   IYZICO_BASE_URL: https://api.iyzipay.com         # NOT sandbox-api
   IYZICO_CALLBACK_URL: https://api.synapse.example.com/api/v1/billing/iyzico/callback
   IYZICO_FRONTEND_SUCCESS: https://synapse.example.com/dashboard/billing?upgraded=1
   IYZICO_FRONTEND_FAILURE: https://synapse.example.com/dashboard/billing?payment=failed
   ```

---

## 6. Image build + push

`main` branch'e push olunca GitHub Actions otomatik build edip GHCR'a push eder.
İlk seferi elle de yapabilirsin:

```bash
docker buildx create --use --name synapse-builder

# Backend
docker buildx build --push -t ghcr.io/<owner>/cvp-backend:v1.0.0 \
  --platform linux/amd64,linux/arm64 backend/

# ai-service
docker buildx build --push -t ghcr.io/<owner>/cvp-ai-service:v1.0.0 \
  --platform linux/amd64 ai-service/

# Frontend (NEXT_PUBLIC_* build args ZORUNLU)
docker buildx build --push -t ghcr.io/<owner>/cvp-frontend:v1.0.0 \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.synapse.example.com/api \
  --build-arg NEXT_PUBLIC_WS_URL=https://api.synapse.example.com/api/ws \
  --platform linux/amd64,linux/arm64 frontend/
```

`infra/k8s/20-backend.yaml`, `21-ai-service.yaml`, `22-frontend.yaml` içindeki
`image:` satırlarını `:v1.0.0` etiketinle değiştir, sonra:

```bash
kubectl apply -f infra/k8s/
```

---

## 7. İlk başlangıç checklist

Pod'lar `Running`'e geçtikten sonra:

- [ ] `kubectl logs deploy/backend -n cv-platform | grep "Bootstrap admin"` görünüyor mu?
- [ ] `https://api.synapse.example.com/api/actuator/health` → `{"status":"UP"}`
- [ ] `https://synapse.example.com/` açılıyor mu?
- [ ] Admin ile login + parola değiştir (`/dashboard/profile` → "Şifre değiştir")
- [ ] Test kullanıcı oluştur, e-posta doğrulama maili gerçekten geliyor mu?
- [ ] OAuth login (Google + GitHub) prod callback'le çalışıyor mu?
- [ ] `https://api.synapse.example.com/api/actuator/prometheus` Prometheus scrape ediyor mu?
- [ ] Grafana dashboard veri akıyor mu?
- [ ] Iyzico checkout — küçük tutarlı bir test ödemesi (1 TL)
- [ ] Backup CronJob çalışıyor mu? (Phase 1)

---

## 8. Production'a NE GİTMEMELİ

`application.yml` (dev) profilindeki şu default'lar prod'da KULLANILMAMALI:

| Konfig | Dev değeri | Prod'da ne olmalı |
|---|---|---|
| `JWT_SECRET` | `dev-secret-change-me...` | `openssl rand -base64 48` çıktısı |
| `ADMIN_BOOTSTRAP_PASSWORD` | `change-me-admin` | 16+ random char (zaten guard refuse eder) |
| `POSTGRES_PASSWORD` | `cvp_dev_pass` | random 32 char |
| `MONGO_PASSWORD` | `cvp_dev_pass` | random 32 char |
| `REDIS_PASSWORD` | `cvp_dev_pass` | random 32 char |
| `RABBITMQ_PASSWORD` | `cvp_dev_pass` | random 32 char |
| `MINIO_ROOT_PASSWORD` | `cvp_dev_pass` | random 32 char |
| SMTP | MailHog | SendGrid/SES/Mailgun |
| `IYZICO_BASE_URL` | `sandbox-api.iyzipay.com` | `api.iyzipay.com` |
| OAuth callbacks | `localhost` | gerçek HTTPS domain |
| `CORS_ALLOWED_ORIGINS` | `localhost:3000` | gerçek frontend domain |

`SPRING_PROFILES_ACTIVE=prod` ayarlandığında `application-prod.yml` devreye girer
ve eksik secret'lar uygulamayı **başlatmaz** (fail-fast). Bu kasıtlı.

---

## 9. Observability (Phase 3 yapıldı — operatöre düşen kurulum)

### 9.1 Sentry (error tracking)
1. [sentry.io](https://sentry.io) → 2 ayrı project oluştur (Java + Next.js)
2. DSN'leri kopyala, secret olarak ekle:
   ```yaml
   SENTRY_DSN: https://xxx@xxx.ingest.sentry.io/yyy           # backend
   NEXT_PUBLIC_SENTRY_DSN: https://xxx@xxx.ingest.sentry.io/zzz  # frontend (build arg)
   SENTRY_ENVIRONMENT: production
   SENTRY_RELEASE: <git-sha>
   ```
3. SDK boş DSN'de no-op olduğu için dev forklarda hiç ping atmaz.

### 9.2 Slack alerts (AlertManager → Slack)
1. Slack workspace → Apps → "Incoming Webhooks" → channel seç (`#synapse-alerts`,
   bir de `#synapse-pager` ciddi olanlar için)
2. Webhook URL'i secret'a ekle: `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...`
3. Compose / K8s alertmanager pod'una env olarak geçir
4. Tetiklenen 4 alert rule (`infra/prometheus/alerts.yml`):
   - **HighErrorRate** — 5xx > %5 (5 dk window)
   - **HighP95Latency** — endpoint p95 > 2 s (5 dk)
   - **JvmHeapAlmostFull** — heap > %90 committed (10 dk)
   - **BackendDown** — actuator scrape kayboldu (2 dk) ← `severity: page`

### 9.3 Loki + Promtail (log aggregation)
- Compose'da otomatik kuruluyor: `docker compose up -d loki promtail`
- Grafana'da Loki datasource hazır → **Explore → Loki → `{container="cvp-backend"}`**
- Default retention ~7 gün; prod için Loki'yi S3 backend ile konfigüre et
  (`storage_config.aws.s3` bölümü)

### 9.4 UptimeRobot (external uptime + status page)
1. [uptimerobot.com](https://uptimerobot.com) → Add Monitor (HTTP)
2. URL: `https://api.synapse.example.com/api/actuator/health` (5 dk interval)
3. Alert contacts → e-posta + Slack
4. Public status page: Settings → Status Pages → `status.synapse.example.com`

## 10. UX / Legal (Phase 4)

### 10.1 SEO + sosyal önizleme
- `src/app/layout.tsx` içinde `metadata` + `viewport` export'ları:
  Open Graph + Twitter card + `metadataBase` set
- OG görseli: `public/og-image.svg` (1200x630, brand gradient)
- `NEXT_PUBLIC_SITE_URL=https://synapse.example.com` build arg'ı eklenmeli
  ki LinkedIn/Slack tam URL ile crawl edebilsin

### 10.2 Yasal metinler
- `/legal/kvkk` — 6698 sayılı KVKK aydınlatma metni (m.10)
- `/legal/privacy` — gizlilik politikası
- `/legal/terms` — kullanım şartları
- `components/Footer.tsx` tüm sayfalara linkliyor
- **Uyarı:** metinler tez sunumu için yazıldı; ticari deploy öncesi
  hukuk danışmanı revizyonu gerekir.

### 10.3 Çerez rızası
- `components/CookieConsent.tsx` — localStorage-gated banner
- Sadece zorunlu + opt-in analytics ayrımı (ePrivacy uyumlu)
- Analiz SDK'larını koşullamak için: `hasAnalyticsConsent()` helper

### 10.4 Erişilebilirlik (WCAG 2.1 AA)
- "Ana içeriğe atla" skip-link (WCAG 2.4.1) — ilk Tab'da görünür
- `viewport.maximumScale: 5` — kullanıcı zoom kapatılmadı (WCAG 1.4.4)
- Cookie banner `role="dialog"` + `aria-live="polite"`
- Eksik: tam Lighthouse a11y geçişi (bazı muted text'ler AA altında;
  design system iter gerekecek)

### 10.5 i18n — ertelendi
next-i18next entegrasyonu Phase 4 kapsam dışı bırakıldı; uygulama
TR-öncelikli. Tez sunumu için yeterli. EN paritesi Phase 6'ya.

## 11. Sıradaki fazlar

- **Phase 5 — Scaling:** Cloudflare CDN, Redis cluster, Postgres read replica,
  multi-region, RabbitMQ quorum queues, autoscale tune
- **Phase 6 — Growth:** LinkedIn OAuth (B planı), referral, Lighthouse CI gate,
  full i18n (EN/TR)

Detay: README "Sonraki" bölümü.
