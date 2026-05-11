# Mimari Dokümanı

## 1. Servis Haritası

| Servis | Port | Sorumluluk |
|--------|------|-----------|
| frontend (Next.js) | 3000 | UI — User / Company / Admin paneller |
| backend (Spring Boot) | 8080 | Auth, kullanıcı/şirket/ilan/başvuru CRUD, ödeme, mesajlaşma WS |
| ai-service (FastAPI) | 8000 | CV parsing, GitHub analiz, Gemini LLM raporları |
| postgres | 5432 | Yapısal veriler |
| mongodb | 27017 | CV JSON'ları, AI raporları, embeddings |
| rabbitmq | 5672 / 15672 | Asenkron CV analiz job'ları |
| redis | 6379 | Cache, rate limit, refresh token denylist |
| minio | 9000 / 9001 | CV dosya depolama (S3 uyumlu) |

## 2. PostgreSQL Şeması (Faz 1+)

```
users
  id (uuid, pk)
  email (unique, not null)
  password_hash
  role (enum: USER, COMPANY, ADMIN)
  subscription_type (enum: FREE, PREMIUM, ENTERPRISE)
  first_name, last_name, city, title, bio
  github_url, linkedin_url
  email_verified (bool)
  banned (bool)
  created_at, updated_at

companies
  id (uuid, pk)
  owner_user_id (fk → users.id)
  name, tax_no, sector, website, logo_url
  description
  verified (bool)  -- admin onayı
  created_at, updated_at

job_postings
  id (uuid, pk)
  company_id (fk → companies.id)
  title, description
  city, remote_type (REMOTE, HYBRID, ONSITE)
  level (JUNIOR, MID, SENIOR, LEAD)
  salary_min, salary_max
  required_skills (jsonb)
  status (DRAFT, ACTIVE, CLOSED)
  view_count
  created_at, updated_at, expires_at

applications
  id (uuid, pk)
  user_id (fk → users.id)
  job_id (fk → job_postings.id)
  cv_snapshot_id (fk → MongoDB doc id)
  status (NEW, REVIEWING, INTERVIEW, REJECTED, OFFERED)
  ats_score (numeric)
  ai_confidence_score (numeric)
  cover_letter (text)
  applied_at, updated_at
  UNIQUE(user_id, job_id)

conversations
  id (uuid, pk)
  user_id, company_id
  application_id (fk, nullable)
  last_message_at
  created_at

messages
  id (uuid, pk)
  conversation_id (fk)
  sender_id (fk → users.id)
  body (text)
  read_at (nullable)
  created_at

payments
  id (uuid, pk)
  user_id (fk)
  iyzico_payment_id
  amount, currency, status
  plan (PREMIUM, ENTERPRISE)
  created_at

subscriptions
  id (uuid, pk)
  user_id (fk)
  plan, status
  starts_at, ends_at
  payment_id (fk)
```

## 3. MongoDB Koleksiyonları

```
cv_documents
  _id, user_id, file_url (minio)
  parsed_json: { personal, education[], experience[], skills[], projects[], languages[] }
  raw_text
  embedding (vector — sentence-transformers)
  created_at, updated_at

analysis_reports
  _id, user_id
  github_data: { repos, languages, commit_frequency, stars }
  llm_report: { summary, skill_scores: { java: 85, python: 72, ... }, inconsistencies[] }
  generated_at

job_embeddings
  _id, job_id (postgres ref)
  description_embedding (vector)
  required_skills_embedding (vector)
```

## 4. Async Akış (RabbitMQ)

```
[USER CV yükler]
   ↓
Backend → Postgres'e application row
   ↓
Backend → RabbitMQ queue: "cv.analyze"
   ↓
ai-service consumer: CV indir (MinIO) → parse → GitHub fetch → Gemini analiz
   ↓
MongoDB'ye rapor + Postgres'e ai_confidence_score update
   ↓
Backend → WebSocket bildirim → User'a "Raporun hazır"
```

## 5. Auth Akışı

- Register: email + password + role (USER/COMPANY). Email doğrulama linki.
- Login: JWT access (15 dk) + refresh (7 gün, Redis denylist destekli)
- RBAC: Spring Security `@PreAuthorize("hasRole('COMPANY')")`
- Şirket onayı: COMPANY register olunca `companies.verified = false` — admin onaylayana kadar ilan açamaz

## 6. Frontend Route Yapısı

```
/                       — landing
/login, /register
/dashboard              — USER dashboard
  /dashboard/cv         — CV upload/edit
  /dashboard/jobs       — ilan listesi + başvuru
  /dashboard/applications — başvurularım
  /dashboard/messages   — mesajlaşma
/company                — COMPANY dashboard
  /company/jobs         — ilan CRUD
  /company/applications — başvuranlar (filter + AI score)
  /company/messages     — adaylarla mesajlaşma
/admin                  — ADMIN paneli
  /admin/users, /admin/companies, /admin/logs
```

## 7. Güvenlik

- HTTPS zorunlu (prod)
- BCrypt password hash (strength 12)
- JWT HS256 (secret env'den)
- Rate limit: Redis-backed, login için 5/dk
- CORS: sadece frontend origin'i
- Dosya upload: max 10MB, MIME whitelist (PDF/DOCX)
- SQL injection: JPA parametrize sorgular
- XSS: Next.js otomatik escape
