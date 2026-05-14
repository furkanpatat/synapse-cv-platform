package com.cvplatform.mockinterview;

import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/mock-interviews")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MockInterviewController {

    private final MockInterviewService service;

    @PostMapping
    public ResponseEntity<MockInterviewDto> start(@AuthenticationPrincipal User user,
                                                  @RequestBody StartBody body) {
        return ResponseEntity.ok(MockInterviewDto.from(
                service.start(user, body.roleTitle(), body.level(),
                        body.sector(), body.jobPostingId())));
    }

    @PostMapping("/{id}/answers")
    public ResponseEntity<MockInterviewDto> submit(@AuthenticationPrincipal User user,
                                                   @PathVariable UUID id,
                                                   @RequestBody AnswerBody body) {
        return ResponseEntity.ok(MockInterviewDto.from(
                service.submitAnswer(user, id, body.questionIndex(), body.transcript())));
    }

    @PostMapping("/{id}/finalize")
    public ResponseEntity<MockInterviewDto> finalize(@AuthenticationPrincipal User user,
                                                     @PathVariable UUID id) {
        return ResponseEntity.ok(MockInterviewDto.from(service.finalize(user, id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MockInterviewDto> get(@AuthenticationPrincipal User user,
                                                @PathVariable UUID id) {
        return ResponseEntity.ok(MockInterviewDto.from(service.get(user, id)));
    }

    @GetMapping
    public ResponseEntity<List<MockInterviewDto>> mine(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listMine(user).stream().map(MockInterviewDto::from).toList());
    }

    public record StartBody(String roleTitle, String level, String sector,
                             UUID jobPostingId) {}
    public record AnswerBody(int questionIndex, String transcript) {}

    public record MockInterviewDto(
            UUID id,
            String roleTitle,
            String level,
            String sector,
            UUID jobPostingId,
            String jobPostingTitle,
            String jobPostingCompany,
            List<String> questions,
            List<String> answers,
            List<Map<String, Object>> perQuestionScores,
            Integer overallScore,
            Integer starCompliance,
            String overallSummary,
            String status,
            Instant createdAt,
            Instant completedAt
    ) {
        public static MockInterviewDto from(MockInterview iv) {
            return new MockInterviewDto(
                    iv.getId(),
                    iv.getRoleTitle(),
                    iv.getLevel(),
                    iv.getSector(),
                    iv.getJobPosting() == null ? null : iv.getJobPosting().getId(),
                    iv.getJobPosting() == null ? null : iv.getJobPosting().getTitle(),
                    iv.getJobPosting() == null || iv.getJobPosting().getCompany() == null
                            ? null
                            : iv.getJobPosting().getCompany().getName(),
                    iv.getQuestions(),
                    iv.getAnswers(),
                    iv.getPerQuestionScores(),
                    iv.getOverallScore(),
                    iv.getStarCompliance(),
                    iv.getOverallSummary(),
                    iv.getStatus(),
                    iv.getCreatedAt(),
                    iv.getCompletedAt()
            );
        }
    }
}
