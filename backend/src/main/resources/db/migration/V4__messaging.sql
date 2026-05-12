-- Faz 7: in-app messaging (user <-> company)

CREATE TABLE conversations (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id      UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT conversations_unique UNIQUE (user_id, company_id)
);

CREATE INDEX idx_conv_user ON conversations(user_id);
CREATE INDEX idx_conv_company ON conversations(company_id);
CREATE INDEX idx_conv_last_msg ON conversations(last_message_at DESC NULLS LAST);

CREATE TABLE messages (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID         NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_user_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT         NOT NULL,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_msg_conv ON messages(conversation_id, created_at);
CREATE INDEX idx_msg_unread ON messages(conversation_id) WHERE read_at IS NULL;
