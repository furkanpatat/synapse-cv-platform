-- Paket 3: bookmark / saved jobs

CREATE TABLE saved_jobs (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id     UUID         NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT saved_jobs_unique UNIQUE (user_id, job_id)
);

CREATE INDEX idx_saved_user_created ON saved_jobs(user_id, created_at DESC);
