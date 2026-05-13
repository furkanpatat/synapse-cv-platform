-- Post-interview AI evaluation fields. After a WebRTC interview ends, the
-- candidate's browser pushes the transcript (Web Speech API) here; backend
-- asks Gemini to score it against the job description.

ALTER TABLE interview_sessions
    ADD COLUMN candidate_transcript TEXT,
    ADD COLUMN ai_summary           TEXT,
    ADD COLUMN ai_overall_score     INTEGER,
    ADD COLUMN ai_strengths         JSONB,
    ADD COLUMN ai_gaps              JSONB,
    ADD COLUMN ai_recommendation    VARCHAR(16),
    ADD COLUMN ai_evaluated_at      TIMESTAMPTZ,

    ADD CONSTRAINT iv_ai_reco_chk
        CHECK (ai_recommendation IS NULL
               OR ai_recommendation IN ('HIRE','MAYBE','PASS'));
