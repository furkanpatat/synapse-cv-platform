package com.cvplatform.analytics;

import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final CompanyAnalyticsService companyAnalytics;
    private final AdminAnalyticsService adminAnalytics;

    @GetMapping("/company")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<CompanyAnalyticsService.CompanyAnalyticsDto> company(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyAnalytics.compute(user));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminAnalyticsService.AdminAnalyticsDto> admin() {
        return ResponseEntity.ok(adminAnalytics.compute());
    }
}
