# CV Platform — AI Destekli CV Doğrulama ve Yetkinlik Analiz Platformu

> SDÜ Bilgisayar Mühendisliği Bitirme Projesi — Furkan Patat (2025-2026)

Kullanıcıların özgeçmişlerini yükleyip GitHub verileriyle karşılaştırarak yapay zekâ destekli yetkinlik analizi üreten, LinkedIn tarzı iş ilanı/başvuru sistemine sahip bir platform.

---

## Mimari

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Frontend   │   │   Backend   │   │ AI Service  │
│  Next.js 14 │◄─►│ Spring Boot │◄─►│  FastAPI    │
│  (port 3000)│   │ (port 8080) │   │ (port 8000) │
└─────────────┘   └──────┬──────┘   └──────┬──────┘
                         │                  │
        ┌────────────────┼──────────────────┘
        │                │
   ┌────▼────┐  ┌────────▼────────┐  ┌──────────┐  ┌──────┐  ┌──────┐
   │Postgres │  │     MongoDB     │  │ RabbitMQ │  │Redis │  │MinIO │
   │(yapısal)│  │ (CV / raporlar) │  │  (queue) │  │(cache│  │(file)│
   └─────────┘  └─────────────────┘  └──────────┘  └──────┘  └──────┘
```

### Roller
- **USER** — birey kullanıcı; CV yükler, GitHub bağlar, ilanlara başvurur
- **COMPANY** — şirket; ilan açar, başvuranları AI skoruyla görür, aday yönetir
- **ADMIN** — sistem yöneticisi; kullanıcı/şirket/log yönetimi

---

## Hızlı Başlangıç

### 1. Altyapıyı ayağa kaldır
```bash
cd infra
cp .env.example .env
docker compose up -d
```

Servisler:
- Postgres → `localhost:5432`
- MongoDB → `localhost:27017`
- RabbitMQ UI → http://localhost:15672 (cvp / cvp_dev_pass)
- Redis → `localhost:6379`
- MinIO UI → http://localhost:9001 (cvp / cvp_dev_pass)

### 2. Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
http://localhost:8080/api/v1/ping

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
http://localhost:3000

### 4. AI Service (FastAPI)
```bash
cd ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
http://localhost:8000/ping

---

## Yol Haritası

| Faz | İçerik | Durum |
|-----|--------|-------|
| 0   | Repo iskeleti + docker-compose + servis skeletonları | ✅ |
| 1   | Auth (JWT, 3 rol), DB şeması, register/login | ⏳ |
| 2   | Frontend auth + role-based layoutlar | ⏳ |
| 3   | CV upload + parsing (PDF/DOCX → JSON) | ⏳ |
| 4   | GitHub analizi + Gemini LLM yetkinlik raporu | ⏳ |
| 5   | Şirket paneli (ilan CRUD, başvuru yönetimi) | ⏳ |
| 6   | Job match + başvuru + ATS skoru | ⏳ |
| 7   | Admin paneli | ⏳ |
| 8   | Iyzico (sandbox) + Premium | ⏳ |
| 9   | DevOps (Docker, CI/CD, deploy) | ⏳ |
| 10  | Test + Doküman + Sunum | ⏳ |

Detaylar için [docs/architecture.md](docs/architecture.md).

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14, TailwindCSS, TypeScript, Zustand |
| Backend | Spring Boot 3.3, Java 21, Spring Security, JPA, Flyway |
| AI Service | Python 3.11, FastAPI, LangChain, Gemini |
| DB | PostgreSQL 16 (yapısal) + MongoDB 7 (CV / raporlar) |
| Queue / Cache | RabbitMQ 3.13, Redis 7 |
| Storage | MinIO (S3-uyumlu) |
| Auth | JWT + Refresh Token, RBAC |
| Ödeme | Iyzico (sandbox) |
| DevOps | Docker Compose, GitHub Actions |

---

## Lisans
Akademik amaçlı — SDÜ Bitirme Projesi
