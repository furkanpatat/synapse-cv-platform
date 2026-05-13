package com.cvplatform.subscription;

import com.cvplatform.audit.AuditEventType;
import com.cvplatform.audit.AuditService;
import com.cvplatform.common.ApiException;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final QuotaService quotaService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @GetMapping("/me")
    public ResponseEntity<BillingMeResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(buildResponse(user));
    }

    /**
     * Sandbox/demo upgrade — no real payment.
     * Production: replace with Iyzico checkout flow + webhook.
     */
    @PostMapping("/upgrade")
    @Transactional
    public ResponseEntity<BillingMeResponse> upgrade(@AuthenticationPrincipal User user,
                                                     @RequestBody Map<String, String> body) {
        String planStr = body.get("plan");
        if (planStr == null) {
            throw ApiException.badRequest("PLAN_REQUIRED", "plan is required");
        }
        SubscriptionType plan;
        try {
            plan = SubscriptionType.valueOf(planStr);
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("INVALID_PLAN", "Unknown plan: " + planStr);
        }
        User managed = userRepository.findById(user.getId()).orElseThrow();
        SubscriptionType old = managed.getSubscriptionType();
        managed.setSubscriptionType(plan);
        managed = userRepository.save(managed);
        auditService.log(AuditEventType.BILLING_UPGRADED, managed,
                "user", managed.getId().toString(),
                "Plan değişti: " + old + " → " + plan,
                Map.of("from", String.valueOf(old), "to", plan.name()));
        return ResponseEntity.ok(buildResponse(managed));
    }

    private BillingMeResponse buildResponse(User user) {
        QuotaService.AnalysisUsage analysis = quotaService.analysisUsage(user);
        QuotaService.ApplicationUsage app = quotaService.applicationUsage(user);
        return new BillingMeResponse(
                user.getSubscriptionType(),
                SubscriptionLimits.isPremium(user.getSubscriptionType()),
                new Usage(analysis.used(), analysis.limit()),
                new Usage(app.active(), app.limit())
        );
    }

    public record BillingMeResponse(
            SubscriptionType plan,
            boolean isPremium,
            Usage aiAnalysisLast30d,
            Usage activeApplications
    ) {}

    public record Usage(long current, int limit) {}
}
