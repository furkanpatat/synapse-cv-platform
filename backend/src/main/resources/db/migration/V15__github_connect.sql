-- Optional "GitHub Connect" — separate from OAuth login. Lets the user
-- grant the `repo` scope so the GitHub analyser can pull their PRIVATE
-- repos for the skill-timeline view. Different from `oauth_subject`,
-- which only proves identity at login time.

ALTER TABLE users
    ADD COLUMN github_connect_token  VARCHAR(255),   -- access token (encrypted at rest)
    ADD COLUMN github_connect_login  VARCHAR(80),    -- their GitHub handle
    ADD COLUMN github_connect_scopes VARCHAR(255),   -- granted scopes (CSV) for auditability
    ADD COLUMN github_connect_at     TIMESTAMPTZ;
