package com.cvplatform.notifications;

import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    public ResponseEntity<NotificationService.NotificationFeed> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.list(user.getId(), page, size));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, Integer>> markRead(@AuthenticationPrincipal User user,
                                                         @PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("updated", service.markRead(user.getId(), id)));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("updated", service.markAllRead(user.getId())));
    }
}
