# Yol Haritası

## Faz 0 — Hazırlık ✅
- [x] Monorepo iskeleti
- [x] docker-compose (Postgres, Mongo, RabbitMQ, Redis, MinIO)
- [x] Spring Boot iskelet + health endpoint
- [x] Next.js 14 iskelet + landing
- [x] FastAPI iskelet + health endpoint
- [x] README + architecture.md
- [x] git init + .gitignore

## Faz 1 — Auth & DB Şeması (2 hafta)
- [ ] Flyway migration: users, companies tabloları
- [ ] User entity + repository
- [ ] AuthController: register / login / refresh / verify-email / reset-password
- [ ] JwtService + JwtAuthFilter
- [ ] Spring Security config + 3 rol (USER, COMPANY, ADMIN)
- [ ] Email doğrulama (SMTP, MailHog dev için)
- [ ] Şirket register flow (companies tablosu, verified=false)
- [ ] Unit testler (AuthService)

## Faz 2 — Frontend Auth & Layout (1.5 hafta)
- [ ] axios client + interceptor (JWT refresh)
- [ ] Zustand auth store
- [ ] /login, /register sayfaları (role seçimi)
- [ ] middleware.ts — route guard
- [ ] 3 layout: /dashboard, /company, /admin
- [ ] Dark/light theme toggle
- [ ] Profil sayfası (kullanıcı bilgisi düzenle)

## Faz 3 — CV Yönetimi (2 hafta)
- [ ] MinIO entegrasyonu (backend + ai-service)
- [ ] /cv/upload endpoint (PDF/DOCX validation)
- [ ] ai-service: pdfplumber + python-docx ile parse
- [ ] MongoDB: cv_documents save
- [ ] Frontend CV upload + parse sonucu editor
- [ ] CV preview component

## Faz 4 — AI Analizi (3 hafta)
- [ ] GitHub OAuth veya kullanıcı GitHub link girer
- [ ] ai-service: PyGithub ile repo/dil/commit fetch
- [ ] LangChain + Gemini integration
- [ ] Prompt template — yetkinlik skoru üret
- [ ] RabbitMQ async job (backend ↔ ai-service)
- [ ] WebSocket bildirim "raporun hazır"
- [ ] Frontend rapor görüntüleme sayfası

## Faz 5 — Şirket Paneli (2.5 hafta)
- [ ] job_postings migration + entity
- [ ] /company/jobs CRUD endpoints
- [ ] applications tablosu
- [ ] Başvuru listesi (filter, sort, AI score gösterimi)
- [ ] Aday detay sayfası (CV preview + AI raporu)
- [ ] Aday durum güncelleme (NEW → INTERVIEW → ...)
- [ ] Şirket profili sayfası (public)

## Faz 6 — Job Match & Başvuru (1.5 hafta)
- [ ] /jobs liste + filtre (kullanıcı tarafı)
- [ ] sentence-transformers ile job embedding
- [ ] "Sana uygun ilanlar" similarity ranking
- [ ] Başvur butonu + cover letter
- [ ] ATS skor hesaplama (keyword match)

## Faz 7 — Mesajlaşma (1 hafta)
- [ ] WebSocket (STOMP) endpoint
- [ ] conversations + messages tabloları
- [ ] Başvuru sonrası otomatik conversation
- [ ] Frontend mesaj UI (unread badge, real-time)

## Faz 8 — Admin Paneli (1 hafta)
- [ ] Kullanıcı/şirket liste + ban/onay
- [ ] Sistem logları görüntüleme
- [ ] RabbitMQ kuyruk istatistiği
- [ ] Ödeme geçmişi tablosu

## Faz 9 — Ödeme (1 hafta)
- [ ] Iyzico sandbox entegrasyonu
- [ ] payments + subscriptions tabloları
- [ ] Premium plan ekranı + checkout
- [ ] Webhook handler
- [ ] PDF rapor indirme (Premium only)

## Faz 10 — DevOps & Deploy (1.5 hafta)
- [ ] Production Dockerfile her servis
- [ ] docker-compose.prod.yml
- [ ] GitHub Actions (test + build)
- [ ] VPS deploy (Hetzner / DigitalOcean)
- [ ] Nginx + Let's Encrypt
- [ ] Prometheus + Grafana

## Faz 11 — Test, Doküman, Sunum (1.5 hafta)
- [ ] JUnit + Pytest unit coverage > %60
- [ ] Playwright E2E (3 kritik flow)
- [ ] Swagger UI dokümantasyonu
- [ ] Bitirme tezi
- [ ] Sunum + demo video
