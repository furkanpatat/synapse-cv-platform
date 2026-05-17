package com.cvplatform.auth;

import com.cvplatform.audit.AuditService;
import com.cvplatform.auth.jwt.JwtProperties;
import com.cvplatform.auth.jwt.JwtService;
import com.cvplatform.auth.token.EmailVerificationTokenRepository;
import com.cvplatform.auth.token.RefreshToken;
import com.cvplatform.auth.token.RefreshTokenRepository;
import com.cvplatform.auth.twofa.TotpService;
import com.cvplatform.common.ApiException;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.mail.MailService;
import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Refresh-token replay detection: when a revoked token comes back to us,
 * we treat it as compromise — kill every refresh token the user has and
 * fire an audit event the operator can grep for.
 *
 * Happy-path rotation is left to AuthServiceTest (would-be), this class
 * just nails the security branch we care about.
 */
class AuthServiceReplayTest {

    private RefreshTokenRepository refreshRepo;
    private AuditService auditService;
    private AuthService service;

    private User victim;

    @BeforeEach
    void setUp() {
        UserRepository userRepo = mock(UserRepository.class);
        CompanyRepository companyRepo = mock(CompanyRepository.class);
        refreshRepo = mock(RefreshTokenRepository.class);
        EmailVerificationTokenRepository emailRepo = mock(EmailVerificationTokenRepository.class);
        PasswordEncoder pwd = mock(PasswordEncoder.class);
        JwtService jwt = mock(JwtService.class);
        JwtProperties jwtProps = new JwtProperties();
        jwtProps.setRefreshExpirationMs(7L * 24 * 3600 * 1000);
        MailService mail = mock(MailService.class);
        auditService = mock(AuditService.class);
        TotpService totp = mock(TotpService.class);

        service = new AuthService(
                userRepo, companyRepo, refreshRepo, emailRepo,
                pwd, jwt, jwtProps, mail, auditService, totp);

        victim = User.builder()
                .id(UUID.randomUUID())
                .email("ayse@example.com")
                .role(Role.USER)
                .build();
    }

    @Test
    @DisplayName("Reuse of revoked token → all user tokens revoked + audit + 401")
    void replayDetected_invalidatesAllAndAudits() {
        // Token was already rotated once (revoked=true) — attacker now retries.
        RefreshToken revoked = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(victim)
                .tokenHash("dummy")
                .expiresAt(Instant.now().plusSeconds(3600))
                .revoked(true)
                .build();
        when(refreshRepo.findByTokenHash(anyString())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> service.refresh("stolen-raw-token"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("kapatıldı");

        // ALL of the victim's other refresh tokens should also be killed.
        verify(refreshRepo, times(1)).revokeAllForUser(eq(victim.getId()));
        // High-signal audit event so the operator can grep
        // "auth.refresh.replay_detected" in the logs.
        verify(auditService, times(1)).log(
                eq("auth.refresh.replay_detected"),
                eq(victim),
                eq("user"),
                eq(victim.getId().toString()),
                anyString(),
                any());
    }

    @Test
    @DisplayName("Expired (not revoked) token → plain 401, no nuke-everything")
    void expiredOnly_noReplaySignal() {
        RefreshToken expired = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(victim)
                .tokenHash("dummy")
                .expiresAt(Instant.now().minusSeconds(60)) // expired
                .revoked(false)
                .build();
        when(refreshRepo.findByTokenHash(anyString())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.refresh("stale-but-not-replayed"))
                .isInstanceOf(ApiException.class);

        // Plain expiry should NOT trigger the nuclear option.
        verify(refreshRepo, times(0)).revokeAllForUser(any());
        verify(auditService, times(0)).log(eq("auth.refresh.replay_detected"),
                any(), anyString(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Unknown token → 401, no audit (could just be expired+deleted)")
    void unknownToken_silentRejection() {
        when(refreshRepo.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.refresh("garbage"))
                .isInstanceOf(ApiException.class);

        verify(refreshRepo, times(0)).revokeAllForUser(any());
        verify(auditService, times(0)).log(eq("auth.refresh.replay_detected"),
                any(), anyString(), anyString(), anyString(), any());
    }
}
