package com.cvplatform.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password,
        /** 6-digit TOTP code, required only when 2FA is enabled on this account. */
        String totpCode
) {}
