package com.cvplatform.auth.oauth;

import com.cvplatform.audit.AuditService;
import com.cvplatform.common.ApiException;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

/**
 * "Connect your GitHub for private repo access" — DIFFERENT from the OAuth
 * login flow in {@link OAuthController}. Login gets read-only public scopes;
 * this asks for {@code repo} so the GitHub analyser can index the user's
 * private projects too.
 *
 * Flow:
 *   1. Authenticated user calls GET /v1/github-connect/start
 *      → backend returns the authorize URL with scope=repo,read:user and
 *        sets a state cookie carrying the user's id so we can re-link on
 *        callback.
 *   2. Browser visits GitHub, user consents, GitHub bounces to
 *      /v1/github-connect/callback?code=…
 *   3. Backend exchanges code → access_token, fetches the user's GitHub
 *      login, persists both on the user row, then 302-redirects to
 *      /dashboard/github-analyze with ?connected=1.
 */
@RestController
@RequestMapping("/v1/github-connect")
@RequiredArgsConstructor
@Slf4j
public class GithubConnectController {

    private static final String STATE_COOKIE = "cvp_gh_connect_state";
    private static final String SCOPE = "repo read:user";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OAuthProperties props;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final RestClient restClient = RestClient.create();

    @GetMapping("/start")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> start(@AuthenticationPrincipal User user,
                                                     HttpServletResponse resp) {
        String stateToken = randomState();
        // We piggy-back the user id on the state cookie so the callback can
        // re-resolve who's connecting (security context isn't carried over
        // a top-level navigation).
        String state = user.getId() + ":" + stateToken;

        Cookie c = new Cookie(STATE_COOKIE, state);
        c.setHttpOnly(true);
        c.setPath("/");
        c.setMaxAge(300);
        resp.addCookie(c);

        String url = "https://github.com/login/oauth/authorize"
                + "?client_id=" + enc(props.getGithub().getClientId())
                + "&redirect_uri=" + enc(connectRedirectUri())
                + "&scope=" + enc(SCOPE)
                + "&state=" + enc(state);
        return ResponseEntity.ok(Map.of("authorizeUrl", url));
    }

    @GetMapping("/callback")
    @SuppressWarnings("unchecked")
    public void callback(@RequestParam("code") String code,
                          @RequestParam(value = "state", required = false) String state,
                          @RequestParam(value = "error", required = false) String error,
                          HttpServletRequest req,
                          HttpServletResponse resp) throws IOException {
        try {
            if (error != null) {
                redirect(resp, "?connectError=" + enc(error));
                return;
            }
            String cookieState = readCookie(req, STATE_COOKIE);
            if (state == null || cookieState == null || !state.equals(cookieState)) {
                redirect(resp, "?connectError=state_mismatch");
                return;
            }
            clearStateCookie(resp);

            // userId before the first ":"
            int colon = state.indexOf(':');
            if (colon < 0) {
                redirect(resp, "?connectError=invalid_state");
                return;
            }
            String userId = state.substring(0, colon);
            User user = userRepository.findById(java.util.UUID.fromString(userId))
                    .orElse(null);
            if (user == null) {
                redirect(resp, "?connectError=user_not_found");
                return;
            }

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("code", code);
            form.add("client_id", props.getGithub().getClientId());
            form.add("client_secret", props.getGithub().getClientSecret());
            form.add("redirect_uri", connectRedirectUri());

            Map<String, Object> token = restClient.post()
                    .uri("https://github.com/login/oauth/access_token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(form)
                    .retrieve()
                    .body(Map.class);
            String accessToken = token == null ? null : (String) token.get("access_token");
            String grantedScopes = token == null ? "" : String.valueOf(token.getOrDefault("scope", ""));
            if (accessToken == null) {
                redirect(resp, "?connectError=token_exchange_failed");
                return;
            }

            // Pull the user's GitHub login so we can later check whether an
            // analyse request targets their own profile (→ use private token)
            // or someone else's (→ use system token, public only).
            Map<String, Object> me = restClient.get()
                    .uri("https://api.github.com/user")
                    .headers(h -> {
                        h.setBearerAuth(accessToken);
                        h.set("Accept", "application/vnd.github+json");
                    })
                    .retrieve()
                    .body(Map.class);
            String login = me == null ? null : String.valueOf(me.get("login"));

            user.setGithubConnectToken(accessToken);
            user.setGithubConnectLogin(login);
            user.setGithubConnectScopes(grantedScopes);
            user.setGithubConnectAt(Instant.now());
            userRepository.save(user);

            auditService.log("github.connect", user,
                    "user", user.getId().toString(),
                    "GitHub private-repo erişimi bağlandı (@" + login + ")",
                    Map.of("scope", grantedScopes));

            redirect(resp, "?connected=1");
        } catch (Exception ex) {
            log.warn("github connect callback failed: {}", ex.toString());
            redirect(resp, "?connectError=" + enc(ex.getMessage() == null ? "failed" : ex.getMessage()));
        }
    }

    /** Status — the UI uses this to render "Connected as @foo" vs "Connect". */
    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> status(@AuthenticationPrincipal User user) {
        boolean connected = user.getGithubConnectToken() != null;
        return ResponseEntity.ok(Map.of(
                "connected", connected,
                "login", user.getGithubConnectLogin() == null ? "" : user.getGithubConnectLogin(),
                "scopes", user.getGithubConnectScopes() == null ? "" : user.getGithubConnectScopes(),
                "connectedAt", user.getGithubConnectAt()
        ));
    }

    /** Disconnect — clears the stored token. Doesn't revoke at GitHub side. */
    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, Object>> disconnect(@AuthenticationPrincipal User user) {
        User managed = userRepository.findById(user.getId()).orElseThrow();
        managed.setGithubConnectToken(null);
        managed.setGithubConnectLogin(null);
        managed.setGithubConnectScopes(null);
        managed.setGithubConnectAt(null);
        userRepository.save(managed);
        auditService.log("github.disconnect", managed,
                "user", managed.getId().toString(),
                "GitHub bağlantısı kaldırıldı", Map.of());
        return ResponseEntity.ok(Map.of("connected", false));
    }

    // ============== utils ==============

    private String connectRedirectUri() {
        // We deliberately use a distinct callback path from login so the
        // OAuthController stays simple and we can grant different scopes here.
        // The provider redirect URI must match what's registered — to keep
        // setup simple, we reuse the github redirect base URL and just swap
        // the path.
        String base = props.getGithub().getRedirectUri();
        if (base == null || base.isBlank()) {
            return "http://localhost:8080/api/v1/github-connect/callback";
        }
        // Replace the /github/callback suffix with /github-connect/callback
        // if it's there; otherwise just append.
        if (base.endsWith("/auth/oauth/github/callback")) {
            return base.replace("/auth/oauth/github/callback", "/github-connect/callback");
        }
        return base;
    }

    private void redirect(HttpServletResponse resp, String querySuffix) throws IOException {
        String frontend = props.getFrontendRedirect();
        // Strip the "/oauth/finish" tail and aim at the github-analyze page.
        String base = frontend.endsWith("/oauth/finish")
                ? frontend.substring(0, frontend.length() - "/oauth/finish".length())
                : frontend;
        String url = base + "/dashboard/github-analyze" + querySuffix;
        resp.setStatus(HttpStatus.FOUND.value());
        resp.setHeader("Location", url);
    }

    private static String readCookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private static void clearStateCookie(HttpServletResponse resp) {
        Cookie c = new Cookie(STATE_COOKIE, "");
        c.setMaxAge(0);
        c.setPath("/");
        resp.addCookie(c);
    }

    private static String randomState() {
        byte[] b = new byte[24];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static String enc(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }
}
