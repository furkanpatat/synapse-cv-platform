package com.cvplatform.messaging.dto;

import com.cvplatform.messaging.Message;

import java.time.Instant;
import java.util.UUID;

public record MessageDto(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String senderName,
        String body,
        Instant readAt,
        Instant createdAt
) {
    public static MessageDto from(Message m) {
        var sender = m.getSender();
        String name = ((sender.getFirstName() == null ? "" : sender.getFirstName()) + " "
                + (sender.getLastName() == null ? "" : sender.getLastName())).trim();
        return new MessageDto(
                m.getId(),
                m.getConversation().getId(),
                sender.getId(),
                name.isEmpty() ? sender.getEmail() : name,
                m.getBody(),
                m.getReadAt(),
                m.getCreatedAt()
        );
    }
}
