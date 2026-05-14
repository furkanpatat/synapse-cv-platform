-- Optional link from a mock interview session to a real job posting.
-- When set, the AI tailors questions to that company / job description
-- (company-culture-fit + required-skill deep dives), not just generic
-- role+level questions.

ALTER TABLE mock_interview_sessions
    ADD COLUMN job_posting_id UUID
        REFERENCES job_postings(id) ON DELETE SET NULL;

CREATE INDEX idx_mock_iv_job ON mock_interview_sessions (job_posting_id);
