package com.cvplatform.auth.oauth;

import com.cvplatform.audit.AuditEventType;
import com.cvplatform.audit.AuditService;
import com.cvplatform.auth.dto.AuthResponse;
import com.cvplatform.auth.jwt.JwtProperties;
import com.cvplatform.auth.jwt.JwtService;
import com.cvplatform.auth.token.RefreshToken;
import com.cvplatform.auth.token.RefreshTokenRepository;
import com.cvplatform.common.ApiException;
import com.cvplatform.user.Role;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

/**
 * Backend-mediated OAuth 2.0 authorization-code flow for Google + GitHub.
 *
 * Flow:
 *   1) Frontend hits  GET /v1/auth/oauth/{provider}/start
 *      → backend builds the provider authorize URL and returns it.
 *   2) Browser navigates to provider, user consents, provider redirects to
 *      our  /v1/auth/oauth/{provider}/callback?code=…
 *   3) Backend exchanges code for an access token, fetches the user info,
 *      finds-or-creates a local User, issues our JWT pair, and 302-redirects
 *      to the frontend  /oauth/finish?accessToken=…&refreshToken=…&… .
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OAuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OAuthProperties props;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final AuditService auditService;
    private final RestClient restClient = RestClient.create();

    public String authorizeUrl(String provider, String state) {
        return switch (provider.toUpperCase()) {
            case "GOOGLE" -> "https://accounts.google.com/o/oauth2/v2/auth"
                    + "?client_id=" + enc(props.getGoogle().getClientId())
                    + "&redirect_uri=" + enc(props.getGoogle().getRedirectUri())
                    + "&response_type=code"
                    + "&scope=" + enc("openid email profile")
                    + "&state=" + enc(state)
                    + "&access_type=online&prompt=select_account";
            case "GITHUB" -> "https://github.com/login/oauth/authorize"
                    + "?client_id=" + enc(props.getGithub().getClientId())
                    + "&redirect_uri=" + enc(props.getGithub().getRedirectUri())
                    + "&scope=" + enc("read:user user:email")
                    + "&state=" + enc(state);
            default -> throw ApiException.badRequest("UNSUPPORTED_PROVIDER",
                    "Provider not supported: " + provider);
        };
    }

    @Transactional
    public AuthResponse exchange(String provider, String code) {
        if (code == null || code.isBlank()) {
            throw ApiException.badRequest("OAUTH_NO_CODE", "Missing authorization code");
        }
        ProviderProfile profile = switch (provider.toUpperCase()) {
            case "GOOGLE" -> exchangeGoogle(code);
            case "GITHUB" -> exchangeGithub(code);
            default -> throw ApiException.badRequest("UNSUPPORTED_PROVIDER",
                    "Provider not supported: " + provider);
        };
        if (profile.email == null || profile.email.isBlank()) {
            throw ApiException.badRequest("OAUTH_NO_EMAIL",
                    "Provider did not return a verified email");
        }

        User user = upsertUser(provider.toUpperCase(), profile);
        if (user.isBanned()) {
            auditService.logLoginFailed(user.getEmail(), "banned_oauth");
            throw ApiException.forbidden("USER_BANNED", "Account is banned");
        }
        auditService.log(AuditEventType.LOGIN_SUCCESS, user,
                "OAuth giriş: " + provider.toUpperCase());

        return issueTokens(user);
    }

    /** Generate a one-time state token. */
    public String newState() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String frontendRedirect() {
        return props.getFrontendRedirect();
    }

    // =================== providers ===================

    private record ProviderProfile(String subject, String email,
                                   String firstName, String lastName,
                                   String avatarUrl) {}

    @SuppressWarnings("unchecked")
    private ProviderProfile exchangeGoogle(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", props.getGoogle().getClientId());
        form.add("client_secret", props.getGoogle().getClientSecret());
        form.add("redirect_uri", props.getGoogle().getRedirectUri());
        form.add("grant_type", "authorization_code");

        Map<String, Object> token = restClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);
        String accessToken = token == null ? null : (String) token.get("access_token");
        if (accessToken == null) {
            throw ApiException.badRequest("OAUTH_TOKEN_FAILED",
                    "Google did not return an access_token");
        }
        Map<String, Object> me = restClient.get()
                .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .body(Map.class);
        if (me == null) {
            throw ApiException.badRequest("OAUTH_USERINFO_FAILED",
                    "Could not fetch Google userinfo");
        }
        String sub = String.valueOf(me.get("sub"));
        String email = (String) me.get("email");
        String given = (String) me.getOrDefault("given_name", "");
        String family = (String) me.getOrDefault("family_name", "");
        String picture = (String) me.get("picture");
        return new ProviderProfile(sub, email,
                blankToNull(given), blankToNull(family), picture);
    }

    @SuppressWarnings("unchecked")
    private ProviderProfile exchangeGithub(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", props.getGithub().getClientId());
        form.add("client_secret", props.getGithub().getClientSecret());
        form.add("redirect_uri", props.getGithub().getRedirectUri());

        Map<String, Object> token = restClient.post()
                .uri("https://github.com/login/oauth/access_token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(form)
                .retrieve()
                .body(Map.class);
        String accessToken = token == null ? null : (String) token.get("access_token");
        if (accessToken == null) {
            throw ApiException.badRequest("OAUTH_TOKEN_FAILED",
                    "GitHub did not return an access_token");
        }
        Map<String, Object> me = restClient.get()
                .uri("https://api.github.com/user")
                .headers(h -> {
                    h.setBearerAuth(accessToken);
                    h.set("Accept", "application/vnd.github+json");
                })
                .retrieve()
                .body(Map.class);
        if (me == null) {
            throw ApiException.badRequest("OAUTH_USERINFO_FAILED",
                    "Could not fetch GitHub userinfo");
        }
        String sub = String.valueOf(me.get("id"));
        String email = (String) me.get("email");
        String name = (String) me.getOrDefault("name", "");
        String avatar = (String) me.get("avatar_url");

        // GitHub often hides the email — fetch the primary verified one.
        if (email == null || email.isBlank()) {
            try {
                @SuppressWarnings("rawtypes")
                java.util.List emails = restClient.get()
                        .uri("https://api.github.com/user/emails")
                        .headers(h -> {
                            h.setBearerAuth(accessToken);
                            h.set("Accept", "application/vnd.github+json");
                        })
                        .retrieve()
                        .body(java.util.List.class);
                if (emails != null) {
                    for (Object o : emails) {
                        Map<String, Object> e = (Map<String, Object>) o;
                        Boolean primary = (Boolean) e.get("primary");
                        Boolean verified = (Boolean) e.get("verified");
                        if (Boolean.TRUE.equals(primary) && Boolean.TRUE.equals(verified)) {
                            email = (String) e.get("email");
                            break;
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("GitHub email fetch failed: {}", ex.toString());
            }
        }

        String first = null, last = null;
        if (name != null && !name.isBlank()) {
            String[] parts = name.trim().split("\\s+", 2);
            first = parts[0];
            if (parts.length > 1) last = parts[1];
        }
        return new ProviderProfile(sub, email, first, last, avatar);
    }

    // =================== local upsert ===================

    private User upsertUser(String provider, ProviderProfile p) {
        // 1) Existing OAuth identity → return as-is.
        User existing = userRepository
                .findByOauthProviderAndOauthSubject(provider, p.subject())
                .orElse(null);
        if (existing != null) return existing;

        // 2) Existing local account with same email → link it.
        existing = userRepository.findByEmail(p.email().toLowerCase().trim()).orElse(null);
        if (existing != null) {
            existing.setOauthProvider(provider);
            existing.setOauthSubject(p.subject());
            if (existing.getAvatarUrl() == null && p.avatarUrl() != null) {
                existing.setAvatarUrl(p.avatarUrl());
            }
            existing.setEmailVerified(true);
            return userRepository.save(existing);
        }

        // 3) Brand new — create a USER-role account, no password.
        User user = User.builder()
                .email(p.email().toLowerCase().trim())
                .role(Role.USER)
                .subscriptionType(SubscriptionType.FREE)
                .firstName(p.firstName())
                .lastName(p.lastName())
                .oauthProvider(provider)
                .oauthSubject(p.subject())
                .avatarUrl(p.avatarUrl())
                .emailVerified(true)
                .banned(false)
                .totpEnabled(false)
                .build();
        user = userRepository.save(user);
        auditService.log(AuditEventType.REGISTER, user,
                "OAuth ile yeni hesap: " + provider + " · " + user.getEmail());
        return user;
    }

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

    // =================== utilities ===================

    private static String enc(String s) {
        return java.net.URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private static String randomToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
