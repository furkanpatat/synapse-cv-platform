-- ============================================================================
-- Synapse CV-Platform — demo seed data (idempotent, ON CONFLICT DO NOTHING)
-- Run:  docker exec -i cvp-postgres psql -U cvp -d cvplatform < infra/seed_demo.sql
--
-- All demo accounts share the same password:  Demo123!
-- bcrypt $2b$12 (Spring's BCryptPasswordEncoder strength 12 — compatible).
-- ============================================================================

-- Stable namespace for deterministic UUIDs so re-runs match existing rows.
\set NS 'synapse-demo-seed'

DO $$
DECLARE
  ns uuid := uuid_generate_v5(uuid_ns_url(), 'synapse-demo-seed');
  pw text := '$2b$12$i9B14ZscjuXHv4oPWtX/PeJvaHGX3RsUym6TjPxtH63zqNGslEXrS'; -- Demo123!

  -- Users
  u_ayse  uuid := uuid_generate_v5(ns, 'user:ayse');
  u_mert  uuid := uuid_generate_v5(ns, 'user:mert');
  u_elif  uuid := uuid_generate_v5(ns, 'user:elif');
  u_hr_tn uuid := uuid_generate_v5(ns, 'user:hr-technova');
  u_hr_ds uuid := uuid_generate_v5(ns, 'user:hr-datasphere');

  -- Companies
  c_tn uuid := uuid_generate_v5(ns, 'company:technova');
  c_ds uuid := uuid_generate_v5(ns, 'company:datasphere');

  -- Jobs
  j_tn_fe uuid := uuid_generate_v5(ns, 'job:tn-frontend');
  j_tn_be uuid := uuid_generate_v5(ns, 'job:tn-backend');
  j_tn_sr uuid := uuid_generate_v5(ns, 'job:tn-senior-fullstack');
  j_ds_de uuid := uuid_generate_v5(ns, 'job:ds-data-engineer');
  j_ds_ml uuid := uuid_generate_v5(ns, 'job:ds-ml');
  j_ds_an uuid := uuid_generate_v5(ns, 'job:ds-analyst');

  -- Applications
  a1 uuid := uuid_generate_v5(ns, 'app:ayse-tn-fe');
  a2 uuid := uuid_generate_v5(ns, 'app:ayse-tn-sr');
  a3 uuid := uuid_generate_v5(ns, 'app:mert-ds-de');
  a4 uuid := uuid_generate_v5(ns, 'app:mert-ds-ml');
  a5 uuid := uuid_generate_v5(ns, 'app:elif-tn-sr');

  -- Conversations
  conv_ayse_tn uuid := uuid_generate_v5(ns, 'conv:ayse-tn');
  conv_mert_ds uuid := uuid_generate_v5(ns, 'conv:mert-ds');
BEGIN
  ----------------------------------------------------------------------------
  -- USERS
  ----------------------------------------------------------------------------
  INSERT INTO users (id, email, password_hash, role, subscription_type,
                     first_name, last_name, city, title, bio,
                     github_url, linkedin_url, email_verified)
  VALUES
    (u_ayse,  'ayse.demo@cv.local',  pw, 'USER',    'PREMIUM',
     'Ayşe', 'Yılmaz', 'İstanbul', 'Frontend Developer',
     'React ve TypeScript ağırlıklı çalışıyorum. 3 yıl deneyim, design systems ve a11y ilgi alanım.',
     'https://github.com/ayseyilmaz', 'https://linkedin.com/in/ayseyilmaz', TRUE),
    (u_mert,  'mert.demo@cv.local',  pw, 'USER',    'FREE',
     'Mert', 'Kaya', 'Ankara', 'Data Engineer',
     'Python + Spark + Airflow. ML pipeline kurmayı seviyorum, 2 yıl deneyim.',
     'https://github.com/mertkaya', NULL, TRUE),
    (u_elif,  'elif.demo@cv.local',  pw, 'USER',    'FREE',
     'Elif', 'Demir', 'İzmir', 'Backend Developer (Junior)',
     'Yeni mezun. Java/Spring ile 1 yıl tecrübe, açık kaynak katkıları var.',
     'https://github.com/elifdemir', NULL, FALSE),
    (u_hr_tn, 'hr@technova.demo',    pw, 'COMPANY', 'PREMIUM',
     'Selin', 'Aydın', 'İstanbul', 'TechNova — HR Lead', NULL, NULL, NULL, TRUE),
    (u_hr_ds, 'hr@datasphere.demo',  pw, 'COMPANY', 'FREE',
     'Burak', 'Şahin', 'Ankara', 'DataSphere — Talent', NULL, NULL, NULL, TRUE)
  ON CONFLICT (email) DO NOTHING;

  ----------------------------------------------------------------------------
  -- COMPANIES
  ----------------------------------------------------------------------------
  INSERT INTO companies (id, owner_user_id, name, tax_no, sector, website,
                         description, verified)
  VALUES
    (c_tn, u_hr_tn, 'TechNova Software',  '1234567890', 'Yazılım & SaaS',
     'https://technova.example',
     'TechNova; B2B SaaS ürünler geliştiren, 60 kişilik bir mühendislik takımıdır. React, Spring Boot, AWS stack.',
     TRUE),
    (c_ds, u_hr_ds, 'DataSphere Analytics', '9876543210', 'Veri & Yapay Zeka',
     'https://datasphere.example',
     'DataSphere; finans ve sağlık sektörüne ML/analitik çözümler sunan 25 kişilik bir ekiptir.',
     TRUE)
  ON CONFLICT (owner_user_id) DO NOTHING;

  ----------------------------------------------------------------------------
  -- JOB POSTINGS
  ----------------------------------------------------------------------------
  INSERT INTO job_postings (id, company_id, title, description, city,
                            remote_type, level, salary_min, salary_max,
                            currency, required_skills, status, view_count,
                            created_at)
  VALUES
    (j_tn_fe, c_tn,
     'Frontend Developer (React)',
     E'TechNova ürün ekibine React/TypeScript ağırlıklı frontend geliştirici arıyoruz.\n\n- React 18, Next.js 14, TypeScript\n- Component library / design system deneyimi\n- Testing Library + Playwright\n- A11y bilinci',
     'İstanbul', 'HYBRID', 'MID', 65000, 95000, 'TRY',
     '["React","TypeScript","Next.js","TailwindCSS","Testing Library"]'::jsonb,
     'ACTIVE', 142, now() - interval '10 days'),

    (j_tn_be, c_tn,
     'Backend Engineer (Spring Boot)',
     E'Java 21 + Spring Boot 3 stack ile yüksek trafikli SaaS backend geliştirme.\n\n- Spring Boot, JPA, PostgreSQL\n- RabbitMQ / Kafka deneyimi artı\n- Docker, AWS\n- Test piramidine inanan biri',
     'İstanbul', 'REMOTE', 'MID', 75000, 110000, 'TRY',
     '["Java","Spring Boot","PostgreSQL","RabbitMQ","Docker"]'::jsonb,
     'ACTIVE', 89, now() - interval '6 days'),

    (j_tn_sr, c_tn,
     'Senior Fullstack Engineer',
     E'5+ yıl tecrübeli, ürün düşünebilen fullstack mühendis.\n\n- React + Node.js veya Java\n- Sistem tasarımı ve mentorluk\n- Cloud (AWS/GCP)',
     'İstanbul', 'HYBRID', 'SENIOR', 130000, 180000, 'TRY',
     '["React","Node.js","AWS","System Design","TypeScript"]'::jsonb,
     'ACTIVE', 51, now() - interval '3 days'),

    (j_ds_de, c_ds,
     'Data Engineer',
     E'Veri pipeline''larının orkestrasyonu ve ölçeklendirilmesi.\n\n- Python, Spark, Airflow\n- Snowflake / BigQuery\n- ETL/ELT best practices',
     'Ankara', 'REMOTE', 'MID', 70000, 100000, 'TRY',
     '["Python","Apache Spark","Airflow","SQL","Snowflake"]'::jsonb,
     'ACTIVE', 64, now() - interval '8 days'),

    (j_ds_ml, c_ds,
     'Machine Learning Engineer',
     E'Production ML modelleri için MLOps + model serving.\n\n- PyTorch / scikit-learn\n- MLflow, Kubeflow\n- Python + REST/gRPC API',
     'Ankara', 'HYBRID', 'SENIOR', 110000, 160000, 'TRY',
     '["Python","PyTorch","MLflow","Docker","Kubernetes"]'::jsonb,
     'ACTIVE', 38, now() - interval '4 days'),

    (j_ds_an, c_ds,
     'Junior Data Analyst',
     E'SQL + Python ile veri analizleri ve dashboard üretimi.\n\n- SQL ileri seviye\n- Tableau / Metabase\n- İstatistik temelleri',
     'Ankara', 'ONSITE', 'JUNIOR', 45000, 60000, 'TRY',
     '["SQL","Python","Tableau","Pandas"]'::jsonb,
     'ACTIVE', 27, now() - interval '2 days')
  ON CONFLICT (id) DO NOTHING;

  ----------------------------------------------------------------------------
  -- APPLICATIONS (rich variety: NEW / REVIEWING / INTERVIEW / REJECTED)
  ----------------------------------------------------------------------------
  INSERT INTO applications (id, user_id, job_id, status, ats_score,
                            ai_overall_score, cover_letter, applied_at)
  VALUES
    (a1, u_ayse, j_tn_fe, 'INTERVIEW', 88, 91,
     'Merhaba, React/TS deneyimimle frontend pozisyonunuz çok uyumlu. Önceki ekipte design system kurmuştum.',
     now() - interval '5 days'),
    (a2, u_ayse, j_tn_sr, 'NEW',        72, 78,
     'Senior rolüne kendimi hazır hissediyorum, 3 yıllık deneyimimle mentorluk yapmaya başladım.',
     now() - interval '2 days'),
    (a3, u_mert, j_ds_de, 'REVIEWING',  84, 86,
     'Airflow + Spark pipeline tasarımı konusunda son projemde 5x throughput artışı sağladım.',
     now() - interval '4 days'),
    (a4, u_mert, j_ds_ml, 'NEW',        68, 70,
     'ML tarafına geçmek istiyorum, son 6 aydır PyTorch ile yan projeler yürütüyorum.',
     now() - interval '1 days'),
    (a5, u_elif, j_tn_sr, 'REJECTED',   42, 38,
     'Junior olmama rağmen başvuruyorum, öğrenme isteğim çok yüksek.',
     now() - interval '6 days')
  ON CONFLICT (user_id, job_id) DO NOTHING;

  ----------------------------------------------------------------------------
  -- SAVED JOBS
  ----------------------------------------------------------------------------
  INSERT INTO saved_jobs (user_id, job_id) VALUES
    (u_ayse, j_tn_be),
    (u_ayse, j_ds_an),
    (u_mert, j_tn_be)
  ON CONFLICT (user_id, job_id) DO NOTHING;

  ----------------------------------------------------------------------------
  -- CONVERSATIONS + MESSAGES
  ----------------------------------------------------------------------------
  INSERT INTO conversations (id, user_id, company_id, last_message_at, created_at)
  VALUES
    (conv_ayse_tn, u_ayse, c_tn, now() - interval '3 hours', now() - interval '5 days'),
    (conv_mert_ds, u_mert, c_ds, now() - interval '1 day',   now() - interval '4 days')
  ON CONFLICT (user_id, company_id) DO NOTHING;

  -- Re-resolve conv ids in case ON CONFLICT skipped (returns existing row's id)
  SELECT id INTO conv_ayse_tn FROM conversations
   WHERE user_id = u_ayse AND company_id = c_tn;
  SELECT id INTO conv_mert_ds FROM conversations
   WHERE user_id = u_mert AND company_id = c_ds;

  -- Messages (only insert if conversation has no messages yet — keep idempotent)
  IF NOT EXISTS (SELECT 1 FROM messages WHERE conversation_id = conv_ayse_tn) THEN
    INSERT INTO messages (conversation_id, sender_user_id, body, read_at, created_at) VALUES
      (conv_ayse_tn, u_hr_tn, 'Merhaba Ayşe, başvurunu inceledik — portföyün çok iyi. Bu hafta görüşme planlayabilir miyiz?',
       now() - interval '4 hours', now() - interval '4 days'),
      (conv_ayse_tn, u_ayse,  'Merhaba Selin, çok teşekkür ederim! Perşembe öğleden sonra uygun olur mu?',
       now() - interval '3 hours 30 minutes', now() - interval '3 days'),
      (conv_ayse_tn, u_hr_tn, 'Harika, Perşembe 14:00 olarak takvime aldım. Detayları ayrıca paylaşacağım.',
       now() - interval '3 hours', now() - interval '3 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM messages WHERE conversation_id = conv_mert_ds) THEN
    INSERT INTO messages (conversation_id, sender_user_id, body, read_at, created_at) VALUES
      (conv_mert_ds, u_hr_ds, 'Selam Mert, Data Engineer ilanı için CV''ni gördük. Airflow tarafındaki tecrüben bizi heyecanlandırdı.',
       NULL, now() - interval '2 days'),
      (conv_mert_ds, u_mert,  'Teşekkürler! Detaylı görüşmek isterim, ilanın takım yapısını paylaşabilir misiniz?',
       NULL, now() - interval '1 day');
  END IF;

  ----------------------------------------------------------------------------
  -- NOTIFICATIONS
  ----------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = u_ayse AND type = 'APPLICATION_STATUS') THEN
    INSERT INTO notifications (user_id, type, title, body, link, created_at) VALUES
      (u_ayse, 'APPLICATION_STATUS', 'Başvurun mülakat aşamasına geçti',
       'TechNova Software — Frontend Developer (React)', '/dashboard/applications',
       now() - interval '5 hours'),
      (u_ayse, 'NEW_MESSAGE', 'TechNova''dan yeni mesaj',
       'Selin Aydın: Perşembe 14:00 olarak takvime aldım…', '/dashboard/messages',
       now() - interval '3 hours'),
      (u_ayse, 'ANALYSIS_COMPLETE', 'CV analizin hazır',
       'AI skoru: 91/100 — detaylı raporu gör.', '/dashboard/analysis',
       now() - interval '2 days'),
      (u_mert, 'NEW_MESSAGE', 'DataSphere''dan yeni mesaj',
       'Burak Şahin: Selam Mert, CV''ni gördük…', '/dashboard/messages',
       now() - interval '2 days'),
      (u_hr_tn, 'NEW_APPLICATION', 'Yeni başvuru: Frontend Developer (React)',
       'Ayşe Yılmaz başvurdu — AI skoru: 91/100', '/company/applications',
       now() - interval '5 days'),
      (u_hr_tn, 'NEW_APPLICATION', 'Yeni başvuru: Senior Fullstack Engineer',
       'Ayşe Yılmaz başvurdu — AI skoru: 78/100', '/company/applications',
       now() - interval '2 days'),
      (u_hr_ds, 'NEW_APPLICATION', 'Yeni başvuru: Data Engineer',
       'Mert Kaya başvurdu — AI skoru: 86/100', '/company/applications',
       now() - interval '4 days');
  END IF;

  ----------------------------------------------------------------------------
  -- INTERVIEW (only if V7 migration is applied)
  ----------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_sessions') THEN
    EXECUTE format($f$
      INSERT INTO interview_sessions
        (id, application_id, candidate_user_id, company_id, scheduled_at,
         duration_min, room_token, status, created_at)
      VALUES
        (%L, %L, %L, %L, now() + interval '2 days', 45, %L, 'SCHEDULED', now())
      ON CONFLICT (id) DO NOTHING
    $f$,
      uuid_generate_v5(ns, 'interview:ayse-tn-fe'),
      a1, u_ayse, c_tn,
      'demo-' || replace(uuid_generate_v5(ns, 'interview-token:ayse-tn-fe')::text, '-', '')
    );
  END IF;

  RAISE NOTICE '✅ Demo seed completed.';
END $$;

-- Summary
SELECT 'users'        AS entity, count(*) FROM users
UNION ALL SELECT 'companies',     count(*) FROM companies
UNION ALL SELECT 'job_postings',  count(*) FROM job_postings
UNION ALL SELECT 'applications',  count(*) FROM applications
UNION ALL SELECT 'saved_jobs',    count(*) FROM saved_jobs
UNION ALL SELECT 'conversations', count(*) FROM conversations
UNION ALL SELECT 'messages',      count(*) FROM messages
UNION ALL SELECT 'notifications', count(*) FROM notifications;
