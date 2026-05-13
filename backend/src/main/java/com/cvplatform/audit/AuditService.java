package com.cvplatform.audit;

import com.cvplatform.user.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Append-only audit writer. Designed to never break the caller — every
 * recording method swallows exceptions and logs to slf4j so a DB issue here
 * doesn't take down login / job creation / etc.
 *
 * The {@link Async} record method runs on Spring's default task executor so
 * the originating request returns immediately even on a slow insert.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository repository;

    public void log(String eventType, User actor, String targetType, String targetId,
                    String summary, Map<String, Object> metadata) {
        recordAsync(buildEntry(eventType, actor, targetType, targetId, summary, metadata));
    }

    /** Convenience overload — no target. */
    public void log(String eventType, User actor, String summary) {
        recordAsync(buildEntry(eventType, actor, null, null, summary, Map.of()));
    }

    /** Convenience overload — system/anonymous event (no actor). */
    public void logAnonymous(String eventType, String summary, Map<String, Object> metadata) {
        recordAsync(buildEntry(eventType, null, null, null, summary, metadata));
    }

    /** Special-purpose: failed login keeps the attempted email even when actor is null. */
    public void logLoginFailed(String email, String reason) {
        AuditLog e = buildEntry(AuditEventType.LOGIN_FAILED, null, "user", null,
                "Başarısız giriş denemesi: " + email,
                Map.of("email", email == null ? "" : email, "reason", reason == null ? "" : reason));
        e.setActorEmail(email);
        recordAsync(e);
    }

    @Async
    public void recordAsync(AuditLog entry) {
        try {
            repository.save(entry);
        } catch (Exception ex) {
            log.warn("Audit insert failed (event={}): {}", entry.getEventType(), ex.toString());
        }
    }

    // ----- internals -----

    private AuditLog buildEntry(String eventType, User actor, String targetType,
                                String targetId, String summary, Map<String, Object> metadata) {
        Map<String, Object> meta = metadata == null ? new HashMap<>() : new HashMap<>(metadata);
        HttpServletRequest req = currentRequest();
        String ip = null;
        String ua = null;
        if (req != null) {
            String forwarded = req.getHeader("X-Forwarded-For");
            ip = forwarded != null && !forwarded.isBlank()
                    ? forwarded.split(",")[0].trim()
                    : req.getRemoteAddr();
            ua = req.getHeader("User-Agent");
            if (ua != null && ua.length() > 500) ua = ua.substring(0, 500);
        }
        return AuditLog.builder()
                .actorId(actor == null ? null : actor.getId())
                .actorEmail(actor == null ? null : actor.getEmail())
                .actorRole(actor == null || actor.getRole() == null ? null : actor.getRole().name())
                .eventType(eventType)
                .targetType(targetType)
                .targetId(targetId)
                .summary(truncate(summary, 500))
                .metadata(meta)
                .ipAddress(ip)
                .userAgent(ua)
                .build();
    }

    private static HttpServletRequest currentRequest() {
        RequestAttributes ra = RequestContextHolder.getRequestAttributes();
        if (ra instanceof ServletRequestAttributes sra) return sra.getRequest();
        return null;
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    // Helper so callers don't have to import UUID + String conversion themselves.
    public static String tid(UUID id) {
        return id == null ? null : id.toString();
    }
}
