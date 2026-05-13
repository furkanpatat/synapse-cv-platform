package com.cvplatform.ai;

import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService service;

    @PostMapping("/cover-letter/{jobId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> coverLetter(@AuthenticationPrincipal User user,
                                                           @PathVariable UUID jobId) {
        return ResponseEntity.ok(Map.of("text", service.generateCoverLetter(user.getId(), jobId)));
    }

    @PostMapping("/bio")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> bio(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("text", service.generateBio(user.getId())));
    }

    @GetMapping("/match-explanation/{jobId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> matchExplanation(@AuthenticationPrincipal User user,
                                                                @PathVariable UUID jobId) {
        return ResponseEntity.ok(Map.of("text", service.generateMatchExplanation(user.getId(), jobId)));
    }

    @GetMapping("/skill-gap/{jobId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> skillGap(@AuthenticationPrincipal User user,
                                                        @PathVariable UUID jobId) {
        return ResponseEntity.ok(Map.of("text", service.generateSkillGap(user.getId(), jobId)));
    }

    @GetMapping("/hiring-brief/{applicationId}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<Map<String, String>> hiringBrief(@AuthenticationPrincipal User user,
                                                           @PathVariable UUID applicationId) {
        return ResponseEntity.ok(Map.of("text", service.generateHiringBrief(applicationId, user.getId())));
    }

    @GetMapping("/interview-questions/{applicationId}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<Map<String, String>> interviewQuestions(@AuthenticationPrincipal User user,
                                                                  @PathVariable UUID applicationId) {
        return ResponseEntity.ok(Map.of("text", service.generateInterviewQuestions(applicationId, user.getId())));
    }

    @GetMapping("/cv-suggestions")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> cvSuggestions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("text", service.generateCvSuggestions(user.getId())));
    }

    @PostMapping("/job-description")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<Map<String, String>> jobDescription(@RequestBody AiAssistantService.JobDescriptionInput input) {
        return ResponseEntity.ok(Map.of("text", service.generateJobDescription(input)));
    }
}
