package com.cvplatform.auth.oauth;

import com.cvplatform.auth.dto.AuthResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/v1/auth/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private static final String STATE_COOKIE = "cvp_oauth_state";

    private final OAuthService oauthService;

    /**
     * Step 1: frontend calls this to learn where to send the user.
     * Returns the provider authorize URL and sets a short-lived state cookie.
     */
    @GetMapping("/{provider}/start")
    public ResponseEntity<Map<String, String>> start(@PathVariable String provider,
                                                     HttpServletResponse resp) {
        String state = oauthService.newState();
        Cookie c = new Cookie(STATE_COOKIE, state);
        c.setHttpOnly(true);
        c.setPath("/");
        c.setMaxAge(300); // 5 min
        resp.addCookie(c);
        String url = oauthService.authorizeUrl(provider, state);
        return ResponseEntity.ok(Map.of("authorizeUrl", url));
    }

    /**
     * Step 3: provider redirects here with ?code=…&state=…
     * We exchange, issue tokens, and 302 to the frontend with tokens in the
     * query string (the frontend's /oauth/finish page stashes them in the
     * auth store and forwards into the app).
     */
    @GetMapping("/{provider}/callback")
    public void callback(@PathVariable String provider,
                         @RequestParam("code") String code,
                         @RequestParam(value = "state", required = false) String state,
                         @RequestParam(value = "error", required = false) String error,
                         HttpServletRequest req,
                         HttpServletResponse resp) throws IOException {
        try {
            if (error != null) {
                redirectWithError(resp, "provider_error:" + error);
                return;
            }
            String stateCookie = readCookie(req, STATE_COOKIE);
            if (state == null || stateCookie == null || !state.equals(stateCookie)) {
                redirectWithError(resp, "state_mismatch");
                return;
            }
            clearCookie(resp);

            AuthResponse auth = oauthService.exchange(provider, code);

            String url = oauthService.frontendRedirect()
                    + "?accessToken=" + enc(auth.accessToken())
                    + "&refreshToken=" + enc(auth.refreshToken())
                    + "&expiresIn=" + auth.expiresInSeconds()
                    + "&email=" + enc(auth.user().email())
                    + "&role=" + auth.user().role().name();
            resp.setStatus(HttpStatus.FOUND.value());
            resp.setHeader("Location", url);
        } catch (Exception ex) {
            redirectWithError(resp, ex.getMessage() == null ? "oauth_failed" : ex.getMessage());
        }
    }

    private void redirectWithError(HttpServletResponse resp, String msg) throws IOException {
        String url = oauthService.frontendRedirect() + "?error=" + enc(msg);
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

    private static void clearCookie(HttpServletResponse resp) {
        Cookie c = new Cookie(STATE_COOKIE, "");
        c.setMaxAge(0);
        c.setPath("/");
        resp.addCookie(c);
    }

    private static String enc(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }
}
