package com.cvplatform.admin.dto;

import com.cvplatform.user.Role;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;

import java.time.Instant;
import java.util.UUID;

public record AdminUserDto(
        UUID id,
        String email,
        String firstName,
        String lastName,
        Role role,
        SubscriptionType subscriptionType,
        boolean emailVerified,
        boolean banned,
        Instant createdAt
) {
    public static AdminUserDto from(User u) {
        return new AdminUserDto(
                u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(),
                u.getRole(), u.getSubscriptionType(),
                u.isEmailVerified(), u.isBanned(), u.getCreatedAt()
        );
    }
}
