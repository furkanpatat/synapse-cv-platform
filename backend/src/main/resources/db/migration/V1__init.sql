-- Faz 1 placeholder migration. Real schema added in Faz 1 (users, companies, roles).
-- Keep this file so Flyway has a baseline.

CREATE TABLE IF NOT EXISTS _meta (
    key   VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO _meta (key, value) VALUES ('schema_version', 'v0-bootstrap')
ON CONFLICT (key) DO NOTHING;
