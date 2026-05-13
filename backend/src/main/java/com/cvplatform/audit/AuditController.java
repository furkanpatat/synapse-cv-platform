package com.cvplatform.audit;

import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository repository;

    /**
     * Admin: paginated audit log with optional filters.
     * Query params: page, size, eventType, actorId, sinceHours
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) Integer sinceHours) {

        Instant since = sinceHours != null && sinceHours > 0
                ? Instant.now().minusSeconds(sinceHours * 3600L)
                : null;
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<AuditLog> result = repository.search(
                emptyToNull(eventType), actorId, since,
                PageRequest.of(Math.max(page, 0), safeSize));

        return ResponseEntity.ok(Map.of(
                "content", result.getContent().stream().map(AuditLogDto::from).toList(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "page", result.getNumber(),
                "size", result.getSize()
        ));
    }

    /** Authenticated user: their own last 50 activity events. */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AuditLogDto>> mine(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                repository.findTop50ByActorIdOrderByCreatedAtDesc(user.getId()).stream()
                        .map(AuditLogDto::from)
                        .toList()
        );
    }

    private static String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
