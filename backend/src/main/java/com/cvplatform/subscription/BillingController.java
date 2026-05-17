package com.cvplatform.subscription;

import com.cvplatform.audit.AuditEventType;
import com.cvplatform.audit.AuditService;
import com.cvplatform.common.ApiException;
import com.cvplatform.subscription.iyzico.IyzicoProperties;
import com.cvplatform.subscription.iyzico.IyzicoService;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/v1/billing")
@RequiredArgsConstructor
@Slf4j
public class BillingController {

    private final QuotaService quotaService;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final IyzicoService iyzicoService;
    private final IyzicoProperties iyzicoProps;

    /**
     * In-memory mapping from Iyzico conversationId → (userId, plan). Lets us
     * recover which user/plan the callback corresponds to without trusting
     * query params. A persistent table would be production-correct; for
     * the demo this is fine — checkouts are short-lived (<10 min).
     */
    private final java.util.Map<String, PendingCheckout> pending = new ConcurrentHashMap<>();

    private record PendingCheckout(UUID userId, SubscriptionType plan) {}

    @GetMapping("/me")
    public ResponseEntity<BillingMeResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(buildResponse(user));
    }

    // ============================================================
    // Iyzico checkout flow
    // ============================================================

    /**
     * Step 1 — start an Iyzico checkout for the chosen plan. Returns the
     * Iyzico-hosted paymentPageUrl the frontend should navigate the
     * browser to. In stub mode (no Iyzico credentials) this URL is our
     * own callback with ?stub=true so the demo loops through to the
     * success page without a real payment.
     */
    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> checkout(@AuthenticationPrincipal User user,
                                                         @RequestBody Map<String, String> body) {
        SubscriptionType plan = parsePlan(body.get("plan"));
        IyzicoService.CheckoutResult init = iyzicoService.initialize(user, plan);
        pending.put(init.token(), new PendingCheckout(user.getId(), plan));
        return ResponseEntity.ok(Map.of(
                "paymentPageUrl", init.paymentPageUrl(),
                "conversationId", init.token(),
                "priceTry", iyzicoService.priceFor(plan).toPlainString(),
                "stubMode", String.valueOf(!iyzicoService.isConfigured())
        ));
    }

    /**
     * Step 2 — Iyzico (or our stub) redirects the user's browser here
     * after the checkout form closes. We look up the payment with the
     * supplied token, flip the user's plan on success, and 302 to the
     * frontend with the result.
     */
    @GetMapping("/iyzico/callback")
    @PostMapping("/iyzico/callback")
    @Transactional
    public void iyzicoCallback(@RequestParam(value = "token", required = false) String token,
                                @RequestParam(value = "conversationId", required = false) String conversationId,
                                HttpServletResponse resp) throws IOException {
        try {
            if (token == null || token.isBlank()) {
                resp.sendRedirect(iyzicoProps.getFrontendFailureUrl() + "&reason=missing_token");
                return;
            }
            // In stub mode the token is "stub-PLAN" — recover plan from there.
            // Otherwise look up the pending entry by conversationId.
            PendingCheckout entry = conversationId == null ? null : pending.remove(conversationId);
            SubscriptionType plan;
            UUID userId;
            if (entry != null) {
                plan = entry.plan();
                userId = entry.userId();
            } else if (token.startsWith("stub-")) {
                // Stub path — but we need the user. Without a session the
                // callback would be useless; require conversationId.
                resp.sendRedirect(iyzicoProps.getFrontendFailureUrl() + "&reason=expired");
                return;
            } else {
                resp.sendRedirect(iyzicoProps.getFrontendFailureUrl() + "&reason=unknown_token");
                return;
            }

            boolean ok = iyzicoService.wasSuccessful(token, conversationId);
            if (!ok) {
                resp.sendRedirect(iyzicoProps.getFrontendFailureUrl());
                return;
            }

            User managed = userRepository.findById(userId).orElseThrow();
            SubscriptionType old = managed.getSubscriptionType();
            managed.setSubscriptionType(plan);
            userRepository.save(managed);
            auditService.log(AuditEventType.BILLING_UPGRADED, managed,
                    "user", managed.getId().toString(),
                    "Iyzico ödemesi başarılı: " + old + " → " + plan,
                    Map.of(
                            "from", String.valueOf(old),
                            "to", plan.name(),
                            "token", token,
                            "stubMode", String.valueOf(!iyzicoService.isConfigured())
                    ));
            resp.sendRedirect(iyzicoProps.getFrontendSuccessUrl()
                    + "&plan=" + plan.name());
        } catch (Exception ex) {
            log.error("Iyzico callback failed", ex);
            resp.sendRedirect(iyzicoProps.getFrontendFailureUrl()
                    + "&reason=" + java.net.URLEncoder.encode(ex.getMessage() == null
                            ? "internal" : ex.getMessage(),
                            java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    private static SubscriptionType parsePlan(String s) {
        if (s == null) throw ApiException.badRequest("PLAN_REQUIRED", "plan is required");
        try {
            return SubscriptionType.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("INVALID_PLAN", "Unknown plan: " + s);
        }
    }

    // ============================================================
    // Legacy dev-only sandbox upgrade — kept for now so existing demo
    // accounts can still flip plans without going through Iyzico.
    // ============================================================

    /**
     * Sandbox/demo upgrade — no real payment.
     * Production: removed in favour of POST /checkout + Iyzico callback.
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
