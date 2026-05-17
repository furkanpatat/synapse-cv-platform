package com.cvplatform.mockinterview;

import com.cvplatform.ai.AiAssistantClient;
import com.cvplatform.common.ApiException;
import com.cvplatform.jobs.JobPostingRepository;
import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Coverage for the solo mock-interview state machine. We mock the LLM
 * client and the repos so the test stays fully in-memory — no Spring
 * context, no containers.
 *
 * What we want to lock down:
 *   - start() generates QUESTION_COUNT (5) questions and sets sane defaults
 *     even when the LLM returns garbage (fallback path)
 *   - start() normalises the role/level fall-throughs
 *   - submitAnswer() rejects bad indexes and bad ownership
 *   - finalize() persists scores + verdict and is idempotent
 *   - ownership check on every mutator
 */
class MockInterviewServiceTest {

    private MockInterviewRepository repository;
    private AiAssistantClient aiClient;
    private JobPostingRepository jobRepository;
    private MockInterviewService service;

    private User user;

    @BeforeEach
    void setUp() {
        repository = mock(MockInterviewRepository.class);
        aiClient = mock(AiAssistantClient.class);
        jobRepository = mock(JobPostingRepository.class);
        service = new MockInterviewService(repository, aiClient, jobRepository);
        // repository.save returns the entity unchanged so we can inspect it.
        when(repository.save(any(MockInterview.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        user = User.builder()
                .id(UUID.randomUUID())
                .email("ayse@example.com")
                .role(Role.USER)
                .build();
    }

    @Test
    @DisplayName("start() generates 5 questions and persists them up front")
    void start_happyPath() {
        // Gemini returns a clean JSON of 5 questions.
        when(aiClient.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("""
                        {"questions": [
                          "Kendini tanıtır mısın?",
                          "En zorlu teknik problemin neydi?",
                          "Takımda anlaşmazlık nasıl çözersin?",
                          "Geliştirmek istediğin bir alan?",
                          "5 yıl sonra nerede görüyorsun?"
                        ]}
                        """);

        MockInterview iv = service.start(user, "Frontend Developer", "MID", "TEKNOLOJI", null);

        assertThat(iv.getQuestions()).hasSize(5);
        assertThat(iv.getRoleTitle()).isEqualTo("Frontend Developer");
        assertThat(iv.getLevel()).isEqualTo("MID");
        assertThat(iv.getSector()).isEqualTo("TEKNOLOJI");
        assertThat(iv.getStatus()).isEqualTo("IN_PROGRESS");
        assertThat(iv.getUser()).isEqualTo(user);
        // The persisted answers list starts empty (NOT null — UI iterates it).
        assertThat(iv.getAnswers()).isEmpty();
        verify(repository).save(iv);
    }

    @Test
    @DisplayName("start() falls back to 5 default questions when the LLM call dies")
    void start_llmFails_fallback() {
        when(aiClient.generateText(anyString(), anyString(), anyDouble()))
                .thenThrow(new RuntimeException("gemini 503"));

        MockInterview iv = service.start(user, "Hemşire", "MID", "SAGLIK", null);

        // Never throws to the user — we always produce questions.
        assertThat(iv.getQuestions()).hasSize(5);
        assertThat(iv.getStatus()).isEqualTo("IN_PROGRESS");
    }

    @Test
    @DisplayName("start() rejects empty role")
    void start_emptyRole_400() {
        assertThatThrownBy(() ->
                service.start(user, "", "MID", "TEKNOLOJI", null))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("start() coerces unknown levels to MID")
    void start_unknownLevel_coercedToMid() {
        when(aiClient.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("{\"questions\":[\"q1\",\"q2\",\"q3\",\"q4\",\"q5\"]}");

        MockInterview iv = service.start(user, "Frontend", "PRINCIPAL", "TEKNOLOJI", null);

        assertThat(iv.getLevel()).isEqualTo("MID");
    }

    @Test
    @DisplayName("submitAnswer() stores the transcript at the right index")
    void submitAnswer_writesAtIndex() {
        MockInterview existing = openSessionWith5Questions();
        when(repository.findById(existing.getId())).thenReturn(java.util.Optional.of(existing));

        MockInterview updated = service.submitAnswer(user, existing.getId(), 2, "  cevabım  ");

        assertThat(updated.getAnswers()).hasSize(3);
        assertThat(updated.getAnswers().get(0)).isEmpty();      // padded
        assertThat(updated.getAnswers().get(2)).isEqualTo("cevabım"); // trimmed
    }

    @Test
    @DisplayName("submitAnswer() rejects out-of-range indexes")
    void submitAnswer_badIndex_400() {
        MockInterview existing = openSessionWith5Questions();
        when(repository.findById(existing.getId())).thenReturn(java.util.Optional.of(existing));

        assertThatThrownBy(() ->
                service.submitAnswer(user, existing.getId(), 99, "x"))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() ->
                service.submitAnswer(user, existing.getId(), -1, "x"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("submitAnswer() rejects sessions not owned by the caller")
    void submitAnswer_ownership_403() {
        MockInterview existing = openSessionWith5Questions();
        when(repository.findById(existing.getId())).thenReturn(java.util.Optional.of(existing));

        User other = User.builder()
                .id(UUID.randomUUID())
                .email("other@x")
                .role(Role.USER)
                .build();
        assertThatThrownBy(() ->
                service.submitAnswer(other, existing.getId(), 0, "x"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("submitAnswer() refuses to mutate an already-completed session")
    void submitAnswer_completedSession_400() {
        MockInterview existing = openSessionWith5Questions();
        existing.setStatus("COMPLETED");
        when(repository.findById(existing.getId())).thenReturn(java.util.Optional.of(existing));

        assertThatThrownBy(() ->
                service.submitAnswer(user, existing.getId(), 0, "x"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("finalize() populates scores from the LLM and marks COMPLETED")
    void finalize_persistsScores() {
        MockInterview iv = openSessionWith5Questions();
        // Pad answers so the prompt has something to evaluate.
        iv.setAnswers(new ArrayList<>(List.of("a1", "a2", "a3", "a4", "a5")));
        when(repository.findById(iv.getId())).thenReturn(java.util.Optional.of(iv));
        when(aiClient.generateText(anyString(), anyString(), anyDouble()))
                .thenReturn("""
                        {
                          "perQuestion":[
                            {"score":80,"feedback":"iyi","strengths":["a"],"gaps":["b"]},
                            {"score":70,"feedback":"orta","strengths":[],"gaps":[]},
                            {"score":85,"feedback":"iyi","strengths":[],"gaps":[]},
                            {"score":60,"feedback":"orta","strengths":[],"gaps":[]},
                            {"score":75,"feedback":"iyi","strengths":[],"gaps":[]}
                          ],
                          "overallScore": 74,
                          "starCompliance": 65,
                          "summary": "Genel olarak iyi"
                        }
                        """);

        MockInterview done = service.finalize(user, iv.getId());

        assertThat(done.getStatus()).isEqualTo("COMPLETED");
        assertThat(done.getOverallScore()).isEqualTo(74);
        assertThat(done.getStarCompliance()).isEqualTo(65);
        assertThat(done.getOverallSummary()).isEqualTo("Genel olarak iyi");
        assertThat(done.getPerQuestionScores()).hasSize(5);
        assertThat(done.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("finalize() is idempotent — re-calling on a completed session is a no-op")
    void finalize_idempotent() {
        MockInterview iv = openSessionWith5Questions();
        iv.setStatus("COMPLETED");
        iv.setOverallScore(80);
        when(repository.findById(iv.getId())).thenReturn(java.util.Optional.of(iv));

        MockInterview again = service.finalize(user, iv.getId());

        assertThat(again.getOverallScore()).isEqualTo(80);
        // No second LLM call — we early-returned.
        verify(aiClient, times(0)).generateText(anyString(), anyString(), anyDouble());
    }

    // ----- helpers -----

    private MockInterview openSessionWith5Questions() {
        return MockInterview.builder()
                .id(UUID.randomUUID())
                .user(user)
                .roleTitle("Frontend")
                .level("MID")
                .sector("TEKNOLOJI")
                .status("IN_PROGRESS")
                .questions(new ArrayList<>(List.of("q1", "q2", "q3", "q4", "q5")))
                .answers(new ArrayList<>())
                .build();
    }
}
