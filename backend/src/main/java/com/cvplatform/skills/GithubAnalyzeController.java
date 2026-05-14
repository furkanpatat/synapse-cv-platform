package com.cvplatform.skills;

import com.cvplatform.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

/**
 * Spring proxy in front of ai-service's /v1/github-analyze/analyze. We don't
 * just expose ai-service directly because (a) auth lives here, and (b) we
 * may later add caching / rate limiting / audit at this layer.
 */
@RestController
@RequestMapping("/v1/github-analyze")
@Slf4j
public class GithubAnalyzeController {

    private final RestClient restClient;

    public GithubAnalyzeController(@Value("${app.ai-service.base-url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // GitHub fetches can be slow when scanning manifests across many repos.
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(180));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @PostMapping("/analyze")
    @PreAuthorize("isAuthenticated()")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> analyze(@AuthenticationPrincipal User user,
                                                       @RequestBody Map<String, Object> body) {
        // Sanitize input — strip "https://github.com/" if user pasted a URL.
        Object raw = body.get("username");
        String username = raw == null ? "" : String.valueOf(raw).trim();
        if (username.startsWith("http")) {
            int slash = username.lastIndexOf('/');
            if (slash >= 0 && slash < username.length() - 1) {
                username = username.substring(slash + 1);
            }
        }
        username = username.replaceAll("[^A-Za-z0-9-]", "");
        if (username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Geçersiz GitHub kullanıcı adı"
            ));
        }
        body.put("username", username);

        try {
            Map<String, Object> result = restClient.post()
                    .uri("/v1/github-analyze/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            log.warn("GitHub analyze proxy failed: {}", ex.toString());
            return ResponseEntity.status(502).body(Map.of(
                    "error", "GitHub analizi başarısız: " + ex.getMessage()
            ));
        }
    }
}
