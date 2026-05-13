-- OAuth + 2FA fields on users.
-- Password hash becomes nullable so OAuth-only signups can exist without one.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
    ADD COLUMN oauth_provider VARCHAR(20),
    ADD COLUMN oauth_subject  VARCHAR(255),
    ADD COLUMN avatar_url     VARCHAR(500),
    ADD COLUMN totp_secret    VARCHAR(64),
    ADD COLUMN totp_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT users_oauth_provider_chk
        CHECK (oauth_provider IS NULL
               OR oauth_provider IN ('GOOGLE', 'GITHUB'));

-- (provider, subject) is the unique external identity
CREATE UNIQUE INDEX idx_users_oauth_identity
    ON users (oauth_provider, oauth_subject)
    WHERE oauth_provider IS NOT NULL;
