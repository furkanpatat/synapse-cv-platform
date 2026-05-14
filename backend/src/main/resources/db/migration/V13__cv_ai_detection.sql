-- AI-generated CV detection: detect CVs likely written by ChatGPT/Gemini/etc.
-- These fields are populated when a CV is analyzed.

ALTER TABLE applications
    ADD COLUMN cv_ai_probability  INTEGER,                    -- 0-100
    ADD COLUMN cv_ai_verdict      VARCHAR(20),                -- HUMAN/SUSPICIOUS/AI_LIKELY
    ADD COLUMN cv_ai_signals      JSONB,                      -- detected signals
    ADD COLUMN cv_ai_detected_at  TIMESTAMPTZ,

    ADD CONSTRAINT app_cv_ai_verdict_chk
        CHECK (cv_ai_verdict IS NULL
               OR cv_ai_verdict IN ('HUMAN','SUSPICIOUS','AI_LIKELY'));
