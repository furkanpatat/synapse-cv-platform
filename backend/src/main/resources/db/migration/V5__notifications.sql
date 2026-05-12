-- Faz 9+ : in-app notification center

CREATE TABLE notifications (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         VARCHAR(40)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    body         TEXT,
    link         VARCHAR(500),
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT notifications_type_chk CHECK (type IN (
        'APPLICATION_STATUS',
        'NEW_APPLICATION',
        'NEW_MESSAGE',
        'ANALYSIS_COMPLETE',
        'COMPANY_VERIFIED',
        'SYSTEM'
    ))
);

CREATE INDEX idx_notif_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON notifications(user_id) WHERE read_at IS NULL;
