package com.cvplatform.subscription;

import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final QuotaService quotaService;

    @GetMapping("/me")
    public ResponseEntity<BillingMeResponse> me(@AuthenticationPrincipal User user) {
        QuotaService.AnalysisUsage analysis = quotaService.analysisUsage(user);
        QuotaService.ApplicationUsage app = quotaService.applicationUsage(user);
        return ResponseEntity.ok(new BillingMeResponse(
                user.getSubscriptionType(),
                SubscriptionLimits.isPremium(user.getSubscriptionType()),
                new Usage(analysis.used(), analysis.limit()),
                new Usage(app.active(), app.limit())
        ));
    }

    public record BillingMeResponse(
            SubscriptionType plan,
            boolean isPremium,
            Usage aiAnalysisLast30d,
            Usage activeApplications
    ) {}

    public record Usage(long current, int limit) {}
}
