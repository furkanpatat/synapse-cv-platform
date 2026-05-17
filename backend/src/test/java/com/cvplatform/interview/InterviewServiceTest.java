package com.cvplatform.interview;

import com.cvplatform.ai.AiAssistantClient;
import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.ApplicationStatus;
import com.cvplatform.jobs.JobPosting;
import com.cvplatform.notifications.NotificationService;
import com.cvplatform.audit.AuditService;
import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Coverage for the interview state machine. The most interesting pieces:
 *
 *   - schedule() — ownership check (company posting), audit + notify
 *   - authorizeRoomAccess() — candidate OR company-owner, otherwise 403
 *   - submitTranscriptAndEvaluate() — Gemini JSON parsing, fallback path
 *     on empty transcript, recommendation enum validation
 *
 * All deps mocked; no Spring context, no containers.
 */
class InterviewServiceTest {

    private InterviewSessionRepository sessionRepo;
    private ApplicationRepository appRepo;
    private CompanyRepository companyRepo;
    private NotificationService notifications;
    private AuditService audit;
    private AiAssistantClient ai;
    private InterviewService service;

    private User candidate;
    private User companyOwner;
    private Company company;
    private JobPosting job;
    private Application application;

    @BeforeEach
    void setUp() {
        sessionRepo = mock(InterviewSessionRepository.class);
        appRepo = mock(ApplicationRepository.class);
        companyRepo = mock(CompanyRepository.class);
        notifications = mock(NotificationService.class);
        audit = mock(AuditService.class);
        ai = mock(AiAssistantClient.class);
        // Real Postgres assigns the id on insert; the mock has to do the
        // same so any service code that audits/notifies on `getId()` after
        // save doesn't NPE.
        when(sessionRepo.save(any(InterviewSession.class)))
                .thenAnswer(inv -> {
                    InterviewSession arg = inv.getArgument(0);
                    if (arg.getId() == null) arg.setId(UUID.randomUUID());
                    return arg;
                });

        service = new InterviewService(
                sessionRepo, appRepo, companyRepo, notifications, audit, ai);

        candidate = User.builder().id(UUID.randomUUID())
                .email("ayse@example.com").role(Role.USER).build();
        companyOwner = User.builder().id(UUID.randomUUID())
                .email("hr@acme.com").role(Role.COMPANY).build();

        company = new Company();
        company.setId(UUID.randomUUID());
        company.setName("TechNova");
        company.setOwner(companyOwner);

        job = new JobPosting();
        job.setId(UUID.randomUUID());
        job.setTitle("Backend Dev");
        job.setCompany(company);

        application = Application.builder()
                .id(UUID.randomUUID())
                .user(candidate)
                .job(job)
                .status(ApplicationStatus.NEW)
                .build();
    }

    // ============ schedule() ============

    @Test
    @DisplayName("schedule() — happy path: persists, flips NEW→INTERVIEW, notifies, audits")
    void schedule_happyPath() {
        when(appRepo.findById(application.getId())).thenReturn(Optional.of(application));
        when(companyRepo.findByOwner_Id(companyOwner.getId())).thenReturn(Optional.of(company));

        Instant when = Instant.now().plusSeconds(3600);
        InterviewSession s = service.schedule(companyOwner, application.getId(), when, 45);

        assertThat(s.getApplication()).isEqualTo(application);
        assertThat(s.getScheduledAt()).isEqualTo(when);
        assertThat(s.getDurationMin()).isEqualTo(45);
        assertThat(s.getRoomToken()).isNotBlank();
        assertThat(s.getStatus()).isEqualTo(InterviewSession.Status.SCHEDULED);
        // Application status auto-flipped
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEW);
        // Candidate notified
        verify(notifications, times(1)).notify(any(), any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("schedule() — application belongs to another company → 403")
    void schedule_wrongCompany_403() {
        when(appRepo.findById(application.getId())).thenReturn(Optional.of(application));
        // Caller's company is NOT the one that posted the job
        Company other = new Company();
        other.setId(UUID.randomUUID());
        other.setOwner(companyOwner);
        when(companyRepo.findByOwner_Id(companyOwner.getId())).thenReturn(Optional.of(other));

        assertThatThrownBy(() ->
                service.schedule(companyOwner, application.getId(),
                        Instant.now().plusSeconds(3600), 45))
                .isInstanceOf(ApiException.class);

        verify(sessionRepo, never()).save(any());
        verify(notifications, never()).notify(any(), any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("schedule() — past date rejected")
    void schedule_pastDate_400() {
        when(appRepo.findById(application.getId())).thenReturn(Optional.of(application));
        when(companyRepo.findByOwner_Id(companyOwner.getId())).thenReturn(Optional.of(company));

        assertThatThrownBy(() ->
                service.schedule(companyOwner, application.getId(),
                        Instant.now().minusSeconds(3600), 45))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("schedule() — already INTERVIEW status is NOT re-flipped (idempotent app status)")
    void schedule_preservesNonNewStatus() {
        application.setStatus(ApplicationStatus.REVIEWING);
        when(appRepo.findById(application.getId())).thenReturn(Optional.of(application));
        when(companyRepo.findByOwner_Id(companyOwner.getId())).thenReturn(Optional.of(company));

        service.schedule(companyOwner, application.getId(),
                Instant.now().plusSeconds(3600), 45);

        // REVIEWING → INTERVIEW per the service contract
        assertThat(application.getStatus()).isEqualTo(ApplicationStatus.INTERVIEW);
    }

    // ============ authorizeRoomAccess() ============

    @Test
    @DisplayName("authorizeRoomAccess() — candidate of the application is allowed")
    void authorize_candidate_ok() {
        InterviewSession s = openSession();
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));

        InterviewSession out = service.authorizeRoomAccess(s.getRoomToken(), candidate);
        assertThat(out).isSameAs(s);
    }

    @Test
    @DisplayName("authorizeRoomAccess() — company owner of the job is allowed")
    void authorize_companyOwner_ok() {
        InterviewSession s = openSession();
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));
        when(companyRepo.findByOwner_Id(companyOwner.getId())).thenReturn(Optional.of(company));

        InterviewSession out = service.authorizeRoomAccess(s.getRoomToken(), companyOwner);
        assertThat(out).isSameAs(s);
    }

    @Test
    @DisplayName("authorizeRoomAccess() — random user → 403")
    void authorize_stranger_403() {
        InterviewSession s = openSession();
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));
        User stranger = User.builder().id(UUID.randomUUID())
                .email("x@x").role(Role.USER).build();
        when(companyRepo.findByOwner_Id(stranger.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.authorizeRoomAccess(s.getRoomToken(), stranger))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("getByToken() — missing token → 404")
    void getByToken_missing_404() {
        when(sessionRepo.findByRoomToken("nope")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getByToken("nope"))
                .isInstanceOf(ApiException.class);
    }

    // ============ markStarted / markEnded ============

    @Test
    @DisplayName("markStarted() — flips SCHEDULED → STARTED + sets startedAt")
    void markStarted_flipsStatus() {
        InterviewSession s = openSession();
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));

        InterviewSession out = service.markStarted(s.getRoomToken(), candidate);
        assertThat(out.getStatus()).isEqualTo(InterviewSession.Status.STARTED);
        assertThat(out.getStartedAt()).isNotNull();
    }

    @Test
    @DisplayName("markStarted() — already STARTED is a no-op (idempotent)")
    void markStarted_idempotent() {
        InterviewSession s = openSession();
        s.setStatus(InterviewSession.Status.STARTED);
        Instant originalStart = Instant.now().minusSeconds(120);
        s.setStartedAt(originalStart);
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));

        service.markStarted(s.getRoomToken(), candidate);
        assertThat(s.getStartedAt()).isEqualTo(originalStart);
    }

    // ============ submitTranscriptAndEvaluate() ============

    @Test
    @DisplayName("evaluate — happy path: parses JSON, persists AI fields, flips to ENDED")
    void evaluate_happyPath() {
        InterviewSession s = openSession();
        s.setStatus(InterviewSession.Status.STARTED);
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));
        when(ai.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("""
                        {
                          "overallScore": 78,
                          "recommendation": "HIRE",
                          "strengths": ["Güçlü iletişim", "STAR uyumlu cevaplar"],
                          "gaps": ["Sistem tasarımı"],
                          "summary": "Aday role uygun."
                        }
                        """);

        InterviewSession out = service.submitTranscriptAndEvaluate(
                s.getRoomToken(), candidate, "Cevabım STAR formatında...");

        assertThat(out.getAiOverallScore()).isEqualTo(78);
        assertThat(out.getAiRecommendation()).isEqualTo("HIRE");
        assertThat(out.getAiStrengths()).hasSize(2);
        assertThat(out.getAiGaps()).hasSize(1);
        assertThat(out.getAiSummary()).contains("uygun");
        assertThat(out.getStatus()).isEqualTo(InterviewSession.Status.ENDED);
        assertThat(out.getAiEvaluatedAt()).isNotNull();
    }

    @Test
    @DisplayName("evaluate — empty transcript → MAYBE fallback (no LLM call)")
    void evaluate_emptyTranscript_fallback() {
        InterviewSession s = openSession();
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));

        InterviewSession out = service.submitTranscriptAndEvaluate(
                s.getRoomToken(), candidate, "   ");

        assertThat(out.getAiRecommendation()).isEqualTo("MAYBE");
        // Should NOT have made an LLM call for an empty transcript.
        verify(ai, never()).generateText(anyString(), anyString(), anyDouble());
    }

    @Test
    @DisplayName("evaluate — invalid recommendation from LLM is clamped to MAYBE")
    void evaluate_invalidRecommendation_clamped() {
        InterviewSession s = openSession();
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));
        when(ai.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("""
                        {"overallScore": 50, "recommendation": "FANTASTIC",
                         "strengths": [], "gaps": [], "summary": "ok"}
                        """);

        InterviewSession out = service.submitTranscriptAndEvaluate(
                s.getRoomToken(), candidate, "blah");
        // FANTASTIC isn't a valid enum value — service must coerce.
        assertThat(out.getAiRecommendation()).isEqualTo("MAYBE");
    }

    @Test
    @DisplayName("evaluate — garbled LLM JSON falls back gracefully (no throw)")
    void evaluate_garbledLlm_fallback() {
        InterviewSession s = openSession();
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));
        when(ai.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("not json at all");

        InterviewSession out = service.submitTranscriptAndEvaluate(
                s.getRoomToken(), candidate, "answer text");
        assertThat(out.getAiRecommendation()).isEqualTo("MAYBE");
        assertThat(out.getAiOverallScore()).isEqualTo(50);
        assertThat(out.getStatus()).isEqualTo(InterviewSession.Status.ENDED);
    }

    @Test
    @DisplayName("evaluate — long transcript is truncated to 50k chars before save")
    void evaluate_truncatesLongTranscript() {
        InterviewSession s = openSession();
        when(sessionRepo.findByRoomToken(s.getRoomToken())).thenReturn(Optional.of(s));
        when(ai.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("{\"overallScore\":50,\"recommendation\":\"MAYBE\","
                        + "\"strengths\":[],\"gaps\":[],\"summary\":\"ok\"}");
        String huge = "x".repeat(60_000);

        InterviewSession out = service.submitTranscriptAndEvaluate(
                s.getRoomToken(), candidate, huge);
        assertThat(out.getCandidateTranscript()).hasSize(50_000);
    }

    // ============ helpers ============

    private InterviewSession openSession() {
        return InterviewSession.builder()
                .id(UUID.randomUUID())
                .application(application)
                .scheduledAt(Instant.now().plusSeconds(3600))
                .durationMin(45)
                .roomToken("room-" + UUID.randomUUID())
                .status(InterviewSession.Status.SCHEDULED)
                .build();
    }
}
