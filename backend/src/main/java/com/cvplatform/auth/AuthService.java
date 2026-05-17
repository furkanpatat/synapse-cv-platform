package com.cvplatform.auth;

import com.cvplatform.auth.dto.AuthResponse;
import com.cvplatform.auth.dto.LoginRequest;
import com.cvplatform.auth.dto.RegisterRequest;
import com.cvplatform.auth.jwt.JwtProperties;
import com.cvplatform.auth.jwt.JwtService;
import com.cvplatform.auth.token.EmailVerificationToken;
import com.cvplatform.auth.token.EmailVerificationTokenRepository;
import com.cvplatform.auth.token.RefreshToken;
import com.cvplatform.auth.token.RefreshTokenRepository;
import com.cvplatform.auth.twofa.TotpService;
import com.cvplatform.audit.AuditEventType;
import com.cvplatform.audit.AuditService;
import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.mail.MailService;
import com.cvplatform.user.Role;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final MailService mailService;
    private final AuditService auditService;
    private final TotpService totpService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.role() == Role.ADMIN) {
            throw ApiException.forbidden("ADMIN_REGISTRATION_FORBIDDEN",
                    "Admin role cannot be self-registered");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw ApiException.conflict("EMAIL_TAKEN", "Email is already registered");
        }
        if (req.role() == Role.COMPANY
                && (req.companyName() == null || req.companyName().isBlank())) {
            throw ApiException.badRequest("COMPANY_NAME_REQUIRED",
                    "companyName is required when registering as COMPANY");
        }

        User user = User.builder()
                .email(req.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(req.role())
                .subscriptionType(SubscriptionType.FREE)
                .firstName(req.firstName())
                .lastName(req.lastName())
                .emailVerified(false)
                .banned(false)
                .build();
        user = userRepository.save(user);

        if (req.role() == Role.COMPANY) {
            Company company = Company.builder()
                    .owner(user)
                    .name(req.companyName())
                    .taxNo(req.taxNo())
                    .sector(req.sector())
                    .verified(false)
                    .build();
            companyRepository.save(company);
        }

        // Send verification email
        String verifyToken = randomToken();
        emailVerificationTokenRepository.save(EmailVerificationToken.builder()
                .user(user)
                .token(verifyToken)
                .expiresAt(Instant.now().plusSeconds(60 * 60 * 24))
                .build());
        mailService.sendVerificationEmail(user.getEmail(), verifyToken);

        auditService.log(AuditEventType.REGISTER, user,
                "Yeni hesap: " + user.getEmail() + " (" + user.getRole() + ")");
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String email = req.email() == null ? "" : req.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            auditService.logLoginFailed(email, "user_not_found");
            throw ApiException.unauthorized("INVALID_CREDENTIALS", "Invalid email or password");
        }
        if (user.isBanned()) {
            auditService.logLoginFailed(email, "banned");
            throw ApiException.forbidden("USER_BANNED", "Account is banned");
        }
        if (user.getPasswordHash() == null) {
            auditService.logLoginFailed(email, "no_password_oauth_only");
            throw ApiException.unauthorized("OAUTH_ONLY_ACCOUNT",
                    "Bu hesap sadece OAuth ile giriş yapıyor — Google/GitHub düğmesini kullan.");
        }
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            auditService.logLoginFailed(email, "bad_password");
            throw ApiException.unauthorized("INVALID_CREDENTIALS", "Invalid email or password");
        }
        if (user.isTotpEnabled()) {
            if (req.totpCode() == null || req.totpCode().isBlank()) {
                // Signal the frontend to prompt for the 2FA code without
                // revealing how far the credentials check got.
                throw ApiException.unauthorized("TOTP_REQUIRED",
                        "İki adımlı doğrulama kodu gerekli");
            }
            if (!totpService.verify(user.getTotpSecret(), req.totpCode())) {
                auditService.logLoginFailed(email, "bad_totp");
                throw ApiException.unauthorized("TOTP_INVALID",
                        "İki adımlı doğrulama kodu hatalı");
            }
        }
        auditService.log(AuditEventType.LOGIN_SUCCESS, user, "Giriş yapıldı");
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String hash = sha256(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> ApiException.unauthorized("INVALID_REFRESH", "Refresh token not found"));

        // ── REPLAY DETECTION ─────────────────────────────────────────
        // A revoked token coming back at us almost always means it was
        // stolen — the legitimate user already rotated it once, and now
        // someone else is trying to use the old copy. We can't tell who
        // is who, so the safe move is to assume both halves are
        // compromised: nuke ALL of that user's refresh tokens (forces a
        // password re-login) and raise a noisy audit event the operator
        // can grep for.
        //
        // An EXPIRED-but-not-revoked token is just normal time passing —
        // no panic, just deny.
        if (stored.isRevoked()) {
            User user = stored.getUser();
            refreshTokenRepository.revokeAllForUser(user.getId());
            auditService.log(
                    "auth.refresh.replay_detected",
                    user,
                    "user", user.getId().toString(),
                    "Reuse of revoked refresh token — all sessions invalidated",
                    Map.of(
                            "tokenId", stored.getId().toString(),
                            "originallyRevokedAt", String.valueOf(stored.getCreatedAt()),
                            "action", "revoke_all_user_tokens"
                    ));
            log.warn("Refresh-token REPLAY detected for user {} (id={}). All sessions invalidated.",
                    user.getEmail(), user.getId());
            throw ApiException.unauthorized("REFRESH_REPLAY",
                    "Bu refresh token daha önce kullanılıp döndürülmüş. " +
                            "Güvenlik için tüm oturumların kapatıldı — lütfen yeniden giriş yap.");
        }
        if (!stored.isActive()) {
            throw ApiException.unauthorized("INVALID_REFRESH", "Refresh token expired");
        }

        // Happy path — rotate.
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return issueTokens(stored.getUser());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String hash = sha256(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken vt = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> ApiException.badRequest("INVALID_TOKEN", "Invalid verification token"));
        if (!vt.isUsable()) {
            throw ApiException.badRequest("INVALID_TOKEN", "Token expired or already used");
        }
        vt.setUsedAt(Instant.now());
        User user = vt.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        emailVerificationTokenRepository.save(vt);
    }

    // ============ helpers ============

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefresh = randomToken();
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .tokenHash(sha256(rawRefresh))
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()))
                .build());

        return new AuthResponse(
                accessToken,
                rawRefresh,
                jwtProperties.getAccessExpirationMs() / 1000,
                new AuthResponse.UserSummary(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getRole(),
                        user.isEmailVerified()
                )
        );
    }

    private static String randomToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
