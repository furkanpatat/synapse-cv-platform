package com.cvplatform.interview;

import com.cvplatform.interview.dto.InterviewDto;
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
@RequestMapping("/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService service;

    @PostMapping("/applications/{applicationId}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<InterviewDto> schedule(@AuthenticationPrincipal User user,
                                                 @PathVariable UUID applicationId,
                                                 @RequestBody ScheduleBody body) {
        Instant when = Instant.parse(body.scheduledAt());
        return ResponseEntity.ok(InterviewDto.from(
                service.schedule(user, applicationId, when, body.durationMin())));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<InterviewDto>> mine(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                service.listMine(user).stream().map(InterviewDto::from).toList()
        );
    }

    @GetMapping("/{token}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<InterviewDto> room(@AuthenticationPrincipal User user,
                                             @PathVariable String token) {
        return ResponseEntity.ok(InterviewDto.from(service.authorizeRoomAccess(token, user)));
    }

    @PostMapping("/{token}/start")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<InterviewDto> start(@AuthenticationPrincipal User user,
                                              @PathVariable String token) {
        return ResponseEntity.ok(InterviewDto.from(service.markStarted(token, user)));
    }

    @PostMapping("/{token}/end")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> end(@AuthenticationPrincipal User user,
                                                    @PathVariable String token) {
        service.markEnded(token, user);
        return ResponseEntity.ok(Map.of("ended", true));
    }

    public record ScheduleBody(String scheduledAt, Integer durationMin) {}
}
