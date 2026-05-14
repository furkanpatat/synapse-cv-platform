-- Make the mock interview practice usable across industries, not just tech.
-- The "sector" field lets the AI question generator tailor its questions —
-- a Hemşirelik mülakatı bambaşka soru seti gerektirir vs. Frontend Dev.

ALTER TABLE mock_interview_sessions
    ADD COLUMN sector VARCHAR(50) NOT NULL DEFAULT 'TEKNOLOJI';
