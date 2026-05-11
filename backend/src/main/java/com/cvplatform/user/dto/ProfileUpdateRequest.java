package com.cvplatform.user.dto;

import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Size(max = 100) String city,
        @Size(max = 150) String title,
        @Size(max = 2000) String bio,
        @Size(max = 500) String githubUrl,
        @Size(max = 500) String linkedinUrl
) {}
