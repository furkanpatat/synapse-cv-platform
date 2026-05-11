-- Faz 5: jobs + applications schema

-- ============ job_postings ============
CREATE TABLE job_postings (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT         NOT NULL,
    city            VARCHAR(100),
    remote_type     VARCHAR(20)  NOT NULL DEFAULT 'ONSITE',
    level           VARCHAR(20)  NOT NULL DEFAULT 'MID',
    salary_min      INTEGER,
    salary_max      INTEGER,
    currency        VARCHAR(8)   NOT NULL DEFAULT 'TRY',
    required_skills JSONB        NOT NULL DEFAULT '[]'::jsonb,
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    view_count      INTEGER      NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT job_remote_chk CHECK (remote_type IN ('REMOTE', 'HYBRID', 'ONSITE')),
    CONSTRAINT job_level_chk  CHECK (level IN ('JUNIOR', 'MID', 'SENIOR', 'LEAD')),
    CONSTRAINT job_status_chk CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED'))
);

CREATE INDEX idx_jobs_company ON job_postings(company_id);
CREATE INDEX idx_jobs_status ON job_postings(status);
CREATE INDEX idx_jobs_created ON job_postings(created_at DESC);

-- ============ applications ============
CREATE TABLE applications (
    id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id               UUID         NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    status               VARCHAR(20)  NOT NULL DEFAULT 'NEW',
    ats_score            INTEGER,
    ai_overall_score     INTEGER,
    cover_letter         TEXT,
    applied_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT app_status_chk CHECK (status IN ('NEW', 'REVIEWING', 'INTERVIEW', 'REJECTED', 'OFFERED')),
    CONSTRAINT app_unique UNIQUE (user_id, job_id)
);

CREATE INDEX idx_apps_job ON applications(job_id);
CREATE INDEX idx_apps_user ON applications(user_id);
CREATE INDEX idx_apps_status ON applications(status);
