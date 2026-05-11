package com.cvplatform.auth.dto;

import com.cvplatform.user.Role;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresInSeconds,
        UserSummary user
) {
    public record UserSummary(
            UUID id,
            String email,
            String firstName,
            String lastName,
            Role role,
            boolean emailVerified
    ) {}
}
