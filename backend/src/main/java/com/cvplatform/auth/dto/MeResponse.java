package com.cvplatform.auth.dto;

import com.cvplatform.user.Role;
import com.cvplatform.user.SubscriptionType;

import java.util.UUID;

public record MeResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        Role role,
        SubscriptionType subscriptionType,
        boolean emailVerified,
        String city,
        String title,
        String bio,
        String githubUrl,
        String linkedinUrl
) {}
