package com.cvplatform.auth.dto;

import com.cvplatform.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotNull Role role,
        // Required only if role == COMPANY
        String companyName,
        String taxNo,
        String sector
) {}
