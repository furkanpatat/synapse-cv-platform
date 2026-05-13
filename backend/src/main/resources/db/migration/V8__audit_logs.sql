-- Audit log: append-only, structured event log for admin oversight & user activity timeline.
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Who triggered the event (nullable for system / anonymous events)
    actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email  VARCHAR(255),
    actor_role   VARCHAR(32),

    -- What happened
    event_type   VARCHAR(64) NOT NULL,
    -- Optional target entity (job:UUID, application:UUID, user:UUID, company:UUID, …)
    target_type  VARCHAR(32),
    target_id    VARCHAR(128),

    -- Free-form human description + JSON metadata
    summary      VARCHAR(500),
    metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Network context (best-effort)
    ip_address   VARCHAR(64),
    user_agent   VARCHAR(500),

    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_created    ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_actor      ON audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_event_type ON audit_logs (event_type, created_at DESC);
CREATE INDEX idx_audit_target     ON audit_logs (target_type, target_id);
