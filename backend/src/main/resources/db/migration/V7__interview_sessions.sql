-- Paket 2: video interview rooms

CREATE TABLE interview_sessions (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id  UUID         NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMPTZ  NOT NULL,
    duration_min    INTEGER      NOT NULL DEFAULT 45,
    room_token      VARCHAR(32)  NOT NULL UNIQUE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT interview_status_chk CHECK (status IN ('SCHEDULED', 'STARTED', 'ENDED', 'CANCELLED'))
);

CREATE INDEX idx_interview_application ON interview_sessions(application_id);
CREATE INDEX idx_interview_scheduled ON interview_sessions(scheduled_at);
