package com.cvplatform.interview;

import com.cvplatform.audit.AuditEventType;
import com.cvplatform.audit.AuditService;
import com.cvplatform.ai.AiAssistantClient;
import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.ApplicationStatus;
import com.cvplatform.jobs.JobPosting;
import com.cvplatform.notifications.NotificationService;
import com.cvplatform.notifications.NotificationType;
import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class InterviewService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final InterviewSessionRepository repository;
    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final AiAssistantClient aiClient;
    private final ObjectMapper mapper = new ObjectMapper();

    @Transactional
    public InterviewSession schedule(User companyOwner,
                                     UUID applicationId,
                                     Instant scheduledAt,
                                     Integer durationMin) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("APPLICATION_NOT_FOUND", "Application not found"));

        // Ownership check
        Company company = companyRepository.findByOwner_Id(companyOwner.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "No company associated with this account"));
        if (!app.getJob().getCompany().getId().equals(company.getId())) {
            throw ApiException.forbidden("APPLICATION_NOT_OWNED",
                    "This application belongs to another company");
        }
        if (scheduledAt == null || scheduledAt.isBefore(Instant.now().minusSeconds(60))) {
            throw ApiException.badRequest("INVALID_DATE", "Scheduled date must be in the future");
        }

        InterviewSession session = InterviewSession.builder()
                .application(app)
                .scheduledAt(scheduledAt)
                .durationMin(durationMin == null ? 45 : durationMin)
                .roomToken(randomToken())
                .status(InterviewSession.Status.SCHEDULED)
                .build();
        session = repository.save(session);

        // Flip application status to INTERVIEW if not already past it
        if (app.getStatus() == ApplicationStatus.NEW || app.getStatus() == ApplicationStatus.REVIEWING) {
            app.setStatus(ApplicationStatus.INTERVIEW);
            applicationRepository.save(app);
        }

        // Notify candidate
        try {
            notificationService.notify(
                    app.getUser().getId(),
                    NotificationType.APPLICATION_STATUS,
                    "🎥 Mülakata davet edildin",
                    company.getName() + " seninle " + scheduledAt + " tarihinde görüşmek istiyor.",
                    "/dashboard/interviews"
            );
        } catch (Exception ignored) {}

        eagerLoad(session);
        auditService.log(AuditEventType.INTERVIEW_SCHEDULED, companyOwner,
                "interview", session.getId().toString(),
                "Mülakat planlandı: " + app.getJob().getTitle() + " · " + scheduledAt,
                Map.of("applicationId", app.getId().toString(),
                       "candidateId", app.getUser().getId().toString(),
                       "durationMin", session.getDurationMin()));
        return session;
    }

    public InterviewSession getByToken(String token) {
        InterviewSession s = repository.findByRoomToken(token)
                .orElseThrow(() -> ApiException.notFound("INTERVIEW_NOT_FOUND",
                        "Interview session not found"));
        eagerLoad(s);
        return s;
    }

    public List<InterviewSession> listMine(User user) {
        List<InterviewSession> list;
        if (user.getRole() == Role.COMPANY) {
            Company company = companyRepository.findByOwner_Id(user.getId())
                    .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                            "No company associated with this account"));
            list = repository.findAllByApplication_Job_Company_IdOrderByScheduledAtDesc(company.getId());
        } else {
            list = repository.findAllByApplication_User_IdOrderByScheduledAtDesc(user.getId());
        }
        list.forEach(this::eagerLoad);
        return list;
    }

    /**
     * Touch the lazy associations that {@code InterviewDto.from(...)} reads, so
     * the DTO can be built outside the transactional scope without hitting
     * {@code LazyInitializationException}.
     */
    private void eagerLoad(InterviewSession s) {
        Application app = s.getApplication();
        if (app == null) return;
        User candidate = app.getUser();
        if (candidate != null) {
            candidate.getFirstName();
            candidate.getLastName();
            candidate.getEmail();
        }
        if (app.getJob() != null) {
            app.getJob().getTitle();
            if (app.getJob().getCompany() != null) {
                app.getJob().getCompany().getName();
            }
        }
    }

    @Transactional
    public InterviewSession markStarted(String token, User caller) {
        InterviewSession s = authorizeRoomAccess(token, caller);
        if (s.getStatus() == InterviewSession.Status.SCHEDULED) {
            s.setStatus(InterviewSession.Status.STARTED);
            s.setStartedAt(Instant.now());
            repository.save(s);
            auditService.log(AuditEventType.INTERVIEW_STARTED, caller,
                    "interview", s.getId().toString(), "Mülakat başladı",
                    Map.of("token", token));
        }
        return s;
    }

    @Transactional
    public InterviewSession markEnded(String token, User caller) {
        InterviewSession s = authorizeRoomAccess(token, caller);
        if (s.getStatus() != InterviewSession.Status.ENDED) {
            s.setStatus(InterviewSession.Status.ENDED);
            s.setEndedAt(Instant.now());
            repository.save(s);
            auditService.log(AuditEventType.INTERVIEW_ENDED, caller,
                    "interview", s.getId().toString(), "Mülakat sonlandırıldı",
                    Map.of("token", token));
        }
        return s;
    }

    public InterviewSession authorizeRoomAccess(String token, User caller) {
        InterviewSession s = getByToken(token);
        boolean isCandidate = s.getApplication().getUser().getId().equals(caller.getId());
        boolean isCompanyOwner = false;
        if (!isCandidate) {
            Company company = companyRepository.findByOwner_Id(caller.getId()).orElse(null);
            isCompanyOwner = company != null
                    && s.getApplication().getJob().getCompany().getId().equals(company.getId());
        }
        if (!isCandidate && !isCompanyOwner) {
            throw ApiException.forbidden("INTERVIEW_NOT_PARTICIPANT",
                    "You are not a participant in this interview");
        }
        return s;
    }

    /**
     * Called by the candidate's browser when the WebRTC interview ends.
     * Stores the live-captured Web Speech transcript, then asks Gemini to
     * score it against the job description. Audited as INTERVIEW_ENDED.
     */
    @Transactional
    public InterviewSession submitTranscriptAndEvaluate(String token, User caller, String transcript) {
        InterviewSession s = authorizeRoomAccess(token, caller);
        if (transcript != null && !transcript.isBlank()) {
            s.setCandidateTranscript(transcript.length() > 50000
                    ? transcript.substring(0, 50000)
                    : transcript);
        }
        Evaluation ev = evaluate(s);
        s.setAiSummary(ev.summary);
        s.setAiOverallScore(ev.overallScore);
        s.setAiStrengths(ev.strengths);
        s.setAiGaps(ev.gaps);
        s.setAiRecommendation(ev.recommendation);
        s.setAiEvaluatedAt(Instant.now());

        if (s.getStatus() != InterviewSession.Status.ENDED) {
            s.setStatus(InterviewSession.Status.ENDED);
            s.setEndedAt(Instant.now());
        }
        repository.save(s);
        auditService.log("interview.ai.evaluated", caller,
                "interview", s.getId().toString(),
                "AI mülakat değerlendirmesi üretildi",
                Map.of("score", ev.overallScore, "reco", ev.recommendation));
        eagerLoad(s);
        return s;
    }

    private record Evaluation(int overallScore, String recommendation,
                              String summary, List<String> strengths, List<String> gaps) {}

    private Evaluation evaluate(InterviewSession s) {
        // Pull the role context — job title + required skills.
        JobPosting job = s.getApplication() == null ? null : s.getApplication().getJob();
        String jobTitle = job == null ? "—" : job.getTitle();
        String jobSkills = job == null || job.getRequiredSkills() == null
                ? ""
                : String.join(", ", job.getRequiredSkills());
        String transcript = s.getCandidateTranscript();
        if (transcript == null || transcript.isBlank()) {
            return new Evaluation(0, "MAYBE",
                    "Mülakat transkripti boş — adayın mikrofonu açık değil olabilir ya da çok kısa konuşmuş olabilir.",
                    List.of(), List.of("Transkript yok — değerlendirme yapılamadı"));
        }

        String systemPrompt = """
                Sen kıdemli bir İK / teknik mülakatçısın. Türkçe konuşuyorsun.
                Sana bir mülakatın adayın sesinden üretilmiş canlı transkripti
                veriliyor (Web Speech API ile, ufak hatalar olabilir). Pozisyon
                başlığını ve aranan yetkinlikleri de veriyorum.

                ÖNEMLİ: Transkriptte teknik terimler veya yabancı kelimeler
                Türkçe ses bilgisi ile yanlış yazılmış olabilir
                (örn. "riak" = React, "kıbırnitis" = Kubernetes, "ce esen" = JSON,
                "post gres" = PostgreSQL). Bunları zihninde normalize ederek
                değerlendir, transkripsiyon hatalarını adaya yükleme.

                Görevin:
                  - overallScore: 0-100 arası bir puan (cevapların kalitesi,
                    role uyum, ifade gücü, somut örnekler)
                  - recommendation: aşağıdakilerden biri kesinlikle:
                      "HIRE"  (güçlü aday)
                      "MAYBE" (orta — başka mülakat ile karar verilebilir)
                      "PASS"  (uygun değil)
                  - strengths: aday için 2-4 maddelik güçlü yönler
                  - gaps: 2-4 maddelik eksik / geliştirilebilir alanlar
                  - summary: 4-6 cümlelik genel İK değerlendirmesi (Türkçe)

                Çıktı SADECE şu JSON yapısında olmalı, ek metin / fence YOK:
                {
                  "overallScore": 0,
                  "recommendation": "HIRE",
                  "strengths": [],
                  "gaps": [],
                  "summary": ""
                }
                """;
        String userPrompt = "Pozisyon: " + jobTitle
                + "\nAranan yetkinlikler: " + jobSkills
                + "\n\nADAY TRANSKRİPTİ:\n" + transcript;

        try {
            String raw = aiClient.generateText(systemPrompt, userPrompt, 0.4);
            String json = extractJson(raw);
            Map<String, Object> parsed = mapper.readValue(json, new TypeReference<>() {});
            int score = parseInt(parsed.get("overallScore"), 50);
            String reco = String.valueOf(parsed.getOrDefault("recommendation", "MAYBE")).toUpperCase();
            if (!List.of("HIRE", "MAYBE", "PASS").contains(reco)) reco = "MAYBE";
            @SuppressWarnings("unchecked")
            List<String> strengths = (List<String>) parsed.getOrDefault("strengths", List.of());
            @SuppressWarnings("unchecked")
            List<String> gaps = (List<String>) parsed.getOrDefault("gaps", List.of());
            String summary = String.valueOf(parsed.getOrDefault("summary", ""));
            return new Evaluation(score, reco, summary, strengths, gaps);
        } catch (Exception ex) {
            log.warn("Interview AI evaluation failed: {}", ex.toString());
            return new Evaluation(50, "MAYBE",
                    "AI değerlendirmesi üretilemedi — transkript kaydedildi, daha sonra tekrar denenebilir.",
                    List.of(), List.of());
        }
    }

    private static int parseInt(Object o, int fallback) {
        if (o instanceof Number n) return n.intValue();
        if (o instanceof String s) {
            try { return Integer.parseInt(s.trim()); } catch (Exception ignored) {}
        }
        return fallback;
    }

    private static String extractJson(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        int firstBrace = s.indexOf('{');
        int lastBrace = s.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return s.substring(firstBrace, lastBrace + 1);
        }
        return s;
    }

    private static String randomToken() {
        byte[] b = new byte[18];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
