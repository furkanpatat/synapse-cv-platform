-- AI-driven solo mock interview practice. A "session" is one practice run:
-- N questions, N transcribed answers, N scores, an overall verbal report.

CREATE TABLE mock_interview_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- What role/level the candidate is preparing for
    role_title      VARCHAR(150) NOT NULL,
    level           VARCHAR(20)  NOT NULL,        -- JUNIOR / MID / SENIOR / LEAD
    language        VARCHAR(8)   NOT NULL DEFAULT 'tr',

    -- Generated up front so the user always sees the next one
    questions       JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Answers indexed by question position; appended as the user submits
    answers         JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Filled at finalize() time
    per_question_scores JSONB,                    -- [{score:0-100, feedback:str, strengths:[], gaps:[]}]
    overall_score   INTEGER,                     -- 0-100
    overall_summary TEXT,
    star_compliance INTEGER,                     -- 0-100, how STAR-ish the answers were

    status          VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
                    -- IN_PROGRESS / COMPLETED / ABANDONED

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,

    CONSTRAINT mock_iv_level_chk
        CHECK (level IN ('JUNIOR','MID','SENIOR','LEAD')),
    CONSTRAINT mock_iv_status_chk
        CHECK (status IN ('IN_PROGRESS','COMPLETED','ABANDONED'))
);

CREATE INDEX idx_mock_iv_user_created
    ON mock_interview_sessions (user_id, created_at DESC);
