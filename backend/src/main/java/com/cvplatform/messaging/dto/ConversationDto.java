package com.cvplatform.messaging.dto;

import com.cvplatform.messaging.Conversation;

import java.time.Instant;
import java.util.UUID;

public record ConversationDto(
        UUID id,
        UUID userId,
        String userName,
        String userTitle,
        UUID companyId,
        String companyName,
        String companyLogoUrl,
        Instant lastMessageAt,
        long unreadCount,
        Instant createdAt
) {
    public static ConversationDto from(Conversation c, long unreadCount) {
        var u = c.getUser();
        var co = c.getCompany();
        String name = ((u.getFirstName() == null ? "" : u.getFirstName()) + " "
                + (u.getLastName() == null ? "" : u.getLastName())).trim();
        return new ConversationDto(
                c.getId(),
                u.getId(),
                name.isEmpty() ? u.getEmail() : name,
                u.getTitle(),
                co.getId(),
                co.getName(),
                co.getLogoUrl(),
                c.getLastMessageAt(),
                unreadCount,
                c.getCreatedAt()
        );
    }
}
