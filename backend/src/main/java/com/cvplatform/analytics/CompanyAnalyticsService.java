package com.cvplatform.analytics;

import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.ApplicationStatus;
import com.cvplatform.jobs.JobPosting;
import com.cvplatform.jobs.JobPostingRepository;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyAnalyticsService {

    private static final DateTimeFormatter DAY_KEY = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final CompanyRepository companyRepository;
    private final JobPostingRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public CompanyAnalyticsDto compute(User owner) {
        Company company = companyRepository.findByOwner_Id(owner.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "No company associated with this account"));

        List<JobPosting> jobs = jobRepository.findAllByCompany_IdOrderByCreatedAtDesc(company.getId());
        long activeJobs = jobs.stream().filter(j -> j.getStatus() == JobStatus.ACTIVE).count();
        long draftJobs = jobs.stream().filter(j -> j.getStatus() == JobStatus.DRAFT).count();
        long closedJobs = jobs.stream().filter(j -> j.getStatus() == JobStatus.CLOSED).count();
        long totalViews = jobs.stream().mapToLong(j -> j.getViewCount() == null ? 0 : j.getViewCount()).sum();

        // Funnel
        Map<ApplicationStatus, Long> funnel = new HashMap<>();
        for (ApplicationStatus s : ApplicationStatus.values()) funnel.put(s, 0L);
        long totalApps = 0;
        long totalApplyToOfferDays = 0;
        long offeredCount = 0;

        List<TopJob> topJobs = new java.util.ArrayList<>();
        Map<String, Long> appsByDay = new LinkedHashMap<>();
        // Seed last 14 days as 0
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        for (int i = 13; i >= 0; i--) {
            appsByDay.put(today.minusDays(i).format(DAY_KEY), 0L);
        }

        for (JobPosting j : jobs) {
            List<Application> apps = applicationRepository.findAllByJob_IdOrderByAppliedAtDesc(j.getId());
            topJobs.add(new TopJob(j.getId(), j.getTitle(), apps.size(),
                    j.getViewCount() == null ? 0 : j.getViewCount()));
            totalApps += apps.size();
            for (Application a : apps) {
                funnel.merge(a.getStatus(), 1L, Long::sum);
                if (a.getStatus() == ApplicationStatus.OFFERED) {
                    Instant applied = a.getAppliedAt();
                    Instant updated = a.getUpdatedAt();
                    if (applied != null && updated != null) {
                        totalApplyToOfferDays += Duration.between(applied, updated).toDays();
                        offeredCount++;
                    }
                }
                if (a.getAppliedAt() != null) {
                    String dayKey = a.getAppliedAt().atZone(ZoneId.systemDefault()).toLocalDate().format(DAY_KEY);
                    appsByDay.computeIfPresent(dayKey, (k, v) -> v + 1);
                }
            }
        }

        topJobs.sort((a, b) -> Integer.compare(b.applications(), a.applications()));
        if (topJobs.size() > 5) topJobs = topJobs.subList(0, 5);

        Double avgTimeToOfferDays = offeredCount == 0 ? null
                : (double) totalApplyToOfferDays / offeredCount;

        List<TimePoint> appsTimeline = appsByDay.entrySet().stream()
                .map(e -> new TimePoint(e.getKey(), e.getValue()))
                .toList();

        return new CompanyAnalyticsDto(
                company.getName(),
                jobs.size(),
                activeJobs,
                draftJobs,
                closedJobs,
                totalApps,
                totalViews,
                offeredCount,
                avgTimeToOfferDays,
                funnel,
                topJobs,
                appsTimeline
        );
    }

    public record CompanyAnalyticsDto(
            String companyName,
            long totalJobs,
            long activeJobs,
            long draftJobs,
            long closedJobs,
            long totalApplications,
            long totalViews,
            long offers,
            Double avgTimeToOfferDays,
            Map<ApplicationStatus, Long> funnel,
            List<TopJob> topJobs,
            List<TimePoint> applicationsLast14Days
    ) {}

    public record TopJob(UUID jobId, String title, int applications, int views) {}
    public record TimePoint(String day, long value) {}
}
