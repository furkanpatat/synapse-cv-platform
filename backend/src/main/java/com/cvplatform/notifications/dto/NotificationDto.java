package com.cvplatform.notifications.dto;

import com.cvplatform.notifications.Notification;
import com.cvplatform.notifications.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        NotificationType type,
        String title,
        String body,
        String link,
        Instant readAt,
        Instant createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getBody(),
                n.getLink(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
