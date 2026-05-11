-- Faz 1: Auth schema (users, companies, refresh tokens, email verification)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ users ============
CREATE TABLE users (
    id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email              VARCHAR(255) NOT NULL UNIQUE,
    password_hash      VARCHAR(255) NOT NULL,
    role               VARCHAR(32)  NOT NULL DEFAULT 'USER',
    subscription_type  VARCHAR(32)  NOT NULL DEFAULT 'FREE',
    first_name         VARCHAR(100),
    last_name          VARCHAR(100),
    city               VARCHAR(100),
    title              VARCHAR(150),
    bio                TEXT,
    github_url         VARCHAR(500),
    linkedin_url       VARCHAR(500),
    email_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    banned             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT users_role_chk CHECK (role IN ('USER', 'COMPANY', 'ADMIN')),
    CONSTRAINT users_subscription_chk CHECK (subscription_type IN ('FREE', 'PREMIUM', 'ENTERPRISE'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============ companies ============
CREATE TABLE companies (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id   UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    tax_no          VARCHAR(50),
    sector          VARCHAR(100),
    website         VARCHAR(500),
    logo_url        VARCHAR(500),
    description     TEXT,
    verified        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_verified ON companies(verified);

-- ============ refresh_tokens ============
-- We store the SHA-256 hash of the refresh token, never the raw value.
CREATE TABLE refresh_tokens (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(128) NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ  NOT NULL,
    revoked      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============ email_verification_tokens ============
CREATE TABLE email_verification_tokens (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        VARCHAR(128) NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ  NOT NULL,
    used_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verif_user ON email_verification_tokens(user_id);

-- ============ password_reset_tokens ============
CREATE TABLE password_reset_tokens (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        VARCHAR(128) NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ  NOT NULL,
    used_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
