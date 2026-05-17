# Şekil 3.3 — Üç Katmanlı Mikro Hizmet Diyagramı

```mermaid
flowchart TB
    subgraph Frontend["🌐 Sunum Katmanı"]
        FE["Next.js 14 · TypeScript<br/>Port 3000"]
    end

    subgraph Backend["⚙️ İş Mantığı Katmanı"]
        BE["Spring Boot 3.3 · Java 21<br/>REST API + WebSocket<br/>Port 8080"]
    end

    subgraph AI["🧠 Yapay Zekâ Katmanı"]
        AISVC["FastAPI · Python 3.11<br/>Gemini + sentence-transformers<br/>Port 8000"]
    end

    subgraph Data["💾 Veri Katmanı"]
        PG[("PostgreSQL 16<br/>5433")]
        MG[("MongoDB 7<br/>27017")]
        RD[("Redis 7<br/>6379")]
        MQ[("RabbitMQ 3.13<br/>5672")]
        S3[("MinIO<br/>9000")]
    end

    FE -->|HTTPS / WSS| BE
    BE -->|REST| AISVC
    BE <--> PG
    BE <--> MG
    BE <--> RD
    BE -->|publish| MQ
    MQ -->|consume| AISVC
    BE <--> S3
    AISVC <--> MG
    AISVC <--> S3

    style FE fill:#6366f1,stroke:#fff,color:#fff
    style BE fill:#10b981,stroke:#fff,color:#fff
    style AISVC fill:#f59e0b,stroke:#fff,color:#fff
```

---

# Şekil 3.4 — Veri Modeli (ER Diyagramı)

```mermaid
erDiagram
    USERS ||--o{ APPLICATIONS : "başvurur"
    USERS ||--o| COMPANIES : "sahip"
    USERS ||--o{ SAVED_JOBS : "kaydeder"
    USERS ||--o{ NOTIFICATIONS : "alır"
    USERS ||--o{ AUDIT_LOGS : "üretir"
    USERS ||--o{ MESSAGES : "gönderir"
    USERS ||--o{ MOCK_INTERVIEW_SESSIONS : "yapar"
    USERS ||--o{ REFRESH_TOKENS : "tutar"

    COMPANIES ||--o{ JOB_POSTINGS : "yayınlar"
    COMPANIES ||--o{ CONVERSATIONS : "katılır"

    JOB_POSTINGS ||--o{ APPLICATIONS : "alır"
    JOB_POSTINGS ||--o{ SAVED_JOBS : "kaydedilir"

    APPLICATIONS ||--o{ INTERVIEW_SESSIONS : "doğurur"

    CONVERSATIONS ||--o{ MESSAGES : "içerir"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        enum role
        enum subscription_type
        bool totp_enabled
        string oauth_provider
        string avatar_url
    }

    COMPANIES {
        uuid id PK
        uuid owner_user_id FK
        string name
        bool verified
    }

    JOB_POSTINGS {
        uuid id PK
        uuid company_id FK
        string title
        enum level
        enum remote_type
        jsonb required_skills
        enum status
    }

    APPLICATIONS {
        uuid id PK
        uuid user_id FK
        uuid job_id FK
        enum status
        int ats_score
        int ai_overall_score
        int cv_ai_probability
        enum cv_ai_verdict
    }

    INTERVIEW_SESSIONS {
        uuid id PK
        uuid application_id FK
        string room_token UK
        enum status
        int ai_overall_score
        enum ai_recommendation
    }

    MOCK_INTERVIEW_SESSIONS {
        uuid id PK
        uuid user_id FK
        string role_title
        enum level
        jsonb questions
        jsonb answers
        int overall_score
    }
```

---

# Şekil 3.5 — AI-CV Tespit Algoritması (İki Aşamalı Boru Hattı)

```mermaid
flowchart TD
    Start([📄 CV Metni Geldi]) --> Check{Metin uzunluğu<br/>≥ 80 karakter?}
    Check -->|Hayır| TooShort[Verdict: HUMAN<br/>Sebep: Yetersiz metin]
    Check -->|Evet| H[Aşama 1: HEURİSTİK PASS]

    H --> H1[Klişe ifade tarama<br/>26 LLM-tell phrase]
    H1 --> H2[Cümle uzunluğu<br/>ort + std sapma]
    H2 --> H3[Type-Token Ratio<br/>kelime çeşitliliği]
    H3 --> H4[Paralel bullet yapısı]
    H4 --> HS["Heuristik Skoru<br/>(0 - 100)"]

    HS --> Gate{Skor ≥ 40?}
    Gate -->|Hayır| Done1["Final: Heuristik skoru × 1.0<br/>Verdict: HUMAN"]
    Gate -->|Evet| LLM[Aşama 2: LLM HAKEM<br/>Gemini 2.5 Flash]

    LLM --> LLMOut["LLM Olasılık<br/>(0 - 100)<br/>+ Türkçe gerekçe"]
    LLMOut --> Blend["Final Skor =<br/>%40 × Heuristik + %60 × LLM"]

    Blend --> Verdict{Final skor?}
    Verdict -->|"< 40"| V1[Verdict: HUMAN]
    Verdict -->|"40-69"| V2[Verdict: SUSPICIOUS]
    Verdict -->|"≥ 70"| V3[Verdict: AI_LIKELY]

    TooShort --> End([💾 Sonuç +<br/>sinyaller kaydedildi])
    Done1 --> End
    V1 --> End
    V2 --> End
    V3 --> End

    style H fill:#fbbf24,stroke:#000,color:#000
    style LLM fill:#a78bfa,stroke:#fff,color:#fff
    style V1 fill:#10b981,stroke:#fff,color:#fff
    style V2 fill:#f59e0b,stroke:#000,color:#000
    style V3 fill:#ef4444,stroke:#fff,color:#fff
```

---

# Şekil 3.6 — JWT + Refresh Token Akışı

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Kullanıcı
    participant FE as 🌐 Frontend
    participant BE as ⚙️ Backend
    participant DB as 💾 PostgreSQL

    Note over User,DB: 1) Giriş (Login)
    User->>FE: e-posta + şifre
    FE->>BE: POST /v1/auth/login
    BE->>DB: SELECT users WHERE email=?
    DB-->>BE: user record + bcrypt hash
    BE->>BE: bcrypt verify
    BE->>BE: Generate access token (JWT, 15 dk)
    BE->>BE: Generate refresh token (random, 7 gün)
    BE->>DB: INSERT refresh_tokens<br/>(sha256 hash + expiresAt)
    BE-->>FE: {accessToken, refreshToken, user}
    FE->>FE: localStorage'a kaydet

    Note over User,DB: 2) Korunan endpoint'e istek
    User->>FE: Sayfayı aç
    FE->>BE: GET /v1/auth/me<br/>Authorization: Bearer <access>
    BE->>BE: JWT signature + expiry doğrula
    BE-->>FE: 200 OK + user data

    Note over User,DB: 3) Access token süresi doldu
    User->>FE: 15 dk sonra başka istek
    FE->>BE: GET /v1/jobs<br/>Bearer <expired-access>
    BE-->>FE: 401 Unauthorized

    Note over User,DB: 4) Refresh akışı (otomatik)
    FE->>BE: POST /v1/auth/refresh<br/>{refreshToken}
    BE->>BE: sha256 hash hesapla
    BE->>DB: SELECT refresh_tokens<br/>WHERE token_hash=? AND expires_at > NOW()
    DB-->>BE: valid record
    BE->>DB: DELETE old refresh_token (rotation)
    BE->>BE: Yeni access + refresh üret
    BE->>DB: INSERT new refresh_token
    BE-->>FE: {accessToken, refreshToken}
    FE->>FE: localStorage güncelle
    FE->>BE: GET /v1/jobs<br/>Bearer <new-access>
    BE-->>FE: 200 OK

    Note over User,DB: 5) Çıkış (Logout)
    User->>FE: Çıkış yap
    FE->>BE: POST /v1/auth/logout<br/>{refreshToken}
    BE->>DB: DELETE refresh_tokens<br/>WHERE token_hash=?
    BE-->>FE: 204 No Content
    FE->>FE: localStorage temizle
```
