package com.cvplatform.audit;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogDto(
        UUID id,
        UUID actorId,
        String actorEmail,
        String actorRole,
        String eventType,
        String targetType,
        String targetId,
        String summary,
        Map<String, Object> metadata,
        String ipAddress,
        Instant createdAt
) {
    public static AuditLogDto from(AuditLog a) {
        return new AuditLogDto(
                a.getId(),
                a.getActorId(),
                a.getActorEmail(),
                a.getActorRole(),
                a.getEventType(),
                a.getTargetType(),
                a.getTargetId(),
                a.getSummary(),
                a.getMetadata(),
                a.getIpAddress(),
                a.getCreatedAt()
        );
    }
}
