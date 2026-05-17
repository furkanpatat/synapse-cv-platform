package com.cvplatform.admin;

import com.cvplatform.admin.dto.AdminCompanyDto;
import com.cvplatform.admin.dto.AdminStats;
import com.cvplatform.admin.dto.AdminUserDto;
import com.cvplatform.common.RateLimitService;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService service;
    private final RateLimitService rateLimit;

    @GetMapping("/stats")
    public ResponseEntity<AdminStats> stats() {
        return ResponseEntity.ok(service.stats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> users() {
        return ResponseEntity.ok(service.listUsers());
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<AdminUserDto> ban(@AuthenticationPrincipal User admin,
                                            @PathVariable UUID id,
                                            @RequestBody Map<String, Boolean> body) {
        boolean banned = body.getOrDefault("banned", true);
        return ResponseEntity.ok(service.setBanned(admin, id, banned));
    }

    @PutMapping("/users/{id}/plan")
    public ResponseEntity<AdminUserDto> setPlan(@AuthenticationPrincipal User admin,
                                                @PathVariable UUID id,
                                                @RequestBody Map<String, String> body) {
        SubscriptionType plan = SubscriptionType.valueOf(body.get("plan"));
        return ResponseEntity.ok(service.setPlan(admin, id, plan));
    }

    @GetMapping("/companies")
    public ResponseEntity<List<AdminCompanyDto>> companies() {
        return ResponseEntity.ok(service.listCompanies());
    }

    @PutMapping("/companies/{id}/verify")
    public ResponseEntity<AdminCompanyDto> verify(@AuthenticationPrincipal User admin,
                                                  @PathVariable UUID id,
                                                  @RequestBody Map<String, Boolean> body) {
        boolean verified = body.getOrDefault("verified", true);
        return ResponseEntity.ok(service.setVerified(admin, id, verified));
    }

    /**
     * Read-only snapshot of today's global AI call count vs the daily
     * Gemini budget. Lets the admin UI render a "X / Y today (Z%)"
     * progress bar so they spot a runaway usage before the circuit
     * breaker trips. -1 used = redis unavailable.
     */
    @GetMapping("/ai-budget")
    public ResponseEntity<Map<String, Object>> aiBudget() {
        long used = rateLimit.globalAiUsageToday();
        int limit = rateLimit.globalDailyBudget();
        return ResponseEntity.ok(Map.of(
                "used", used,
                "limit", limit,
                "percent", limit <= 0 ? 0 : (used * 100.0 / limit),
                "exhausted", used >= 0 && used >= limit
        ));
    }
}
