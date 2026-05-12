package com.cvplatform.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendMessageRequest(
        UUID conversationId,
        UUID toCompanyId,     // if conversationId == null and sender is USER
        UUID toUserId,        // if conversationId == null and sender is COMPANY
        @NotBlank @Size(max = 5000) String body
) {}
