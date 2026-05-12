package com.cvplatform.subscription;

import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.common.ApiException;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.ApplicationStatus;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuotaService {

    private static final Set<ApplicationStatus> ACTIVE_APP_STATUSES = Set.of(
            ApplicationStatus.NEW, ApplicationStatus.REVIEWING, ApplicationStatus.INTERVIEW
    );

    private final AnalysisReportRepository analysisRepository;
    private final ApplicationRepository applicationRepository;

    public void checkAnalysisQuota(User user) {
        if (SubscriptionLimits.isPremium(user.getSubscriptionType())) return;
        long usedThisMonth = countAnalysesSince(user.getId(),
                Instant.now().minus(30, ChronoUnit.DAYS));
        if (usedThisMonth >= SubscriptionLimits.FREE_AI_ANALYSES_PER_MONTH) {
            throw new ApiException(
                    org.springframework.http.HttpStatus.PAYMENT_REQUIRED,
                    "QUOTA_EXCEEDED",
                    "FREE plan allows " + SubscriptionLimits.FREE_AI_ANALYSES_PER_MONTH
                            + " analysis per 30 days. Upgrade to PREMIUM for unlimited analysis.");
        }
    }

    public void checkApplyQuota(User user) {
        if (SubscriptionLimits.isPremium(user.getSubscriptionType())) return;
        long active = applicationRepository.findAllByUser_IdOrderByAppliedAtDesc(user.getId())
                .stream()
                .filter(a -> ACTIVE_APP_STATUSES.contains(a.getStatus()))
                .count();
        if (active >= SubscriptionLimits.FREE_ACTIVE_APPLICATIONS) {
            throw new ApiException(
                    org.springframework.http.HttpStatus.PAYMENT_REQUIRED,
                    "QUOTA_EXCEEDED",
                    "FREE plan allows " + SubscriptionLimits.FREE_ACTIVE_APPLICATIONS
                            + " active applications. Close or wait on existing applications or upgrade.");
        }
    }

    public AnalysisUsage analysisUsage(User user) {
        long used = countAnalysesSince(user.getId(),
                Instant.now().minus(30, ChronoUnit.DAYS));
        int limit = SubscriptionLimits.isPremium(user.getSubscriptionType())
                ? -1
                : SubscriptionLimits.FREE_AI_ANALYSES_PER_MONTH;
        return new AnalysisUsage(used, limit);
    }

    public ApplicationUsage applicationUsage(User user) {
        long active = applicationRepository.findAllByUser_IdOrderByAppliedAtDesc(user.getId())
                .stream()
                .filter(a -> ACTIVE_APP_STATUSES.contains(a.getStatus()))
                .count();
        int limit = SubscriptionLimits.isPremium(user.getSubscriptionType())
                ? -1
                : SubscriptionLimits.FREE_ACTIVE_APPLICATIONS;
        return new ApplicationUsage(active, limit);
    }

    public long countActiveJobsForCompany(UUID companyId, java.util.List<com.cvplatform.jobs.JobPosting> jobs) {
        return jobs.stream()
                .filter(j -> j.getStatus() == JobStatus.ACTIVE)
                .count();
    }

    public void checkCompanyActiveJobQuota(User companyOwner, long currentActive) {
        if (SubscriptionLimits.isPremium(companyOwner.getSubscriptionType())) return;
        if (currentActive >= SubscriptionLimits.FREE_COMPANY_ACTIVE_JOBS) {
            throw new ApiException(
                    org.springframework.http.HttpStatus.PAYMENT_REQUIRED,
                    "QUOTA_EXCEEDED",
                    "FREE company plan allows " + SubscriptionLimits.FREE_COMPANY_ACTIVE_JOBS
                            + " active jobs. Close older postings or upgrade to ENTERPRISE.");
        }
    }

    private long countAnalysesSince(UUID userId, Instant since) {
        return analysisRepository.findAll().stream()
                .filter(r -> userId.equals(r.getUserId()))
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(since))
                .count();
    }

    public record AnalysisUsage(long used, int limit) {}
    public record ApplicationUsage(long active, int limit) {}
}
