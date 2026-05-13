package com.cvplatform.analytics;

import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.JobPostingRepository;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.user.Role;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAnalyticsService {

    private static final DateTimeFormatter DAY_KEY = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobPostingRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final CvDocumentRepository cvRepository;
    private final AnalysisReportRepository analysisRepository;

    public AdminAnalyticsDto compute() {
        List<User> users = userRepository.findAll();

        Map<Role, Long> usersByRole = new EnumMap<>(Role.class);
        Map<SubscriptionType, Long> planDistribution = new EnumMap<>(SubscriptionType.class);
        for (Role r : Role.values()) usersByRole.put(r, 0L);
        for (SubscriptionType s : SubscriptionType.values()) planDistribution.put(s, 0L);

        Map<String, Long> usersByDay = new LinkedHashMap<>();
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        for (int i = 29; i >= 0; i--) {
            usersByDay.put(today.minusDays(i).format(DAY_KEY), 0L);
        }

        long banned = 0;
        long verifiedEmails = 0;
        for (User u : users) {
            usersByRole.merge(u.getRole(), 1L, Long::sum);
            planDistribution.merge(u.getSubscriptionType(), 1L, Long::sum);
            if (u.isBanned()) banned++;
            if (u.isEmailVerified()) verifiedEmails++;
            if (u.getCreatedAt() != null) {
                String dayKey = u.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().format(DAY_KEY);
                usersByDay.computeIfPresent(dayKey, (k, v) -> v + 1);
            }
        }

        long totalCompanies = companyRepository.count();
        long verifiedCompanies = companyRepository.findAll().stream().filter(c -> c.isVerified()).count();
        long totalJobs = jobRepository.count();
        long activeJobs = jobRepository
                .findAllByStatus(JobStatus.ACTIVE,
                        org.springframework.data.domain.PageRequest.of(0, 1))
                .getTotalElements();
        long totalApps = applicationRepository.count();
        long cvCount = cvRepository.count();
        long analysisCount = analysisRepository.count();

        // Top skills across all CVs
        Map<String, Long> skillFreq = new HashMap<>();
        for (CvDocument cv : cvRepository.findAll()) {
            if (cv.getSkills() == null) continue;
            for (String s : cv.getSkills()) {
                if (s == null || s.isBlank()) continue;
                skillFreq.merge(s.trim(), 1L, Long::sum);
            }
        }
        List<SkillCount> topSkills = skillFreq.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(e -> new SkillCount(e.getKey(), e.getValue()))
                .toList();

        return new AdminAnalyticsDto(
                users.size(),
                banned,
                verifiedEmails,
                totalCompanies,
                verifiedCompanies,
                totalJobs,
                activeJobs,
                totalApps,
                cvCount,
                analysisCount,
                usersByRole,
                planDistribution,
                usersByDay.entrySet().stream()
                        .map(e -> new TimePoint(e.getKey(), e.getValue()))
                        .toList(),
                topSkills
        );
    }

    public record AdminAnalyticsDto(
            long totalUsers,
            long bannedUsers,
            long verifiedEmails,
            long totalCompanies,
            long verifiedCompanies,
            long totalJobs,
            long activeJobs,
            long totalApplications,
            long totalCvs,
            long totalAiAnalyses,
            Map<Role, Long> usersByRole,
            Map<SubscriptionType, Long> planDistribution,
            List<TimePoint> usersLast30Days,
            List<SkillCount> topSkills
    ) {}

    public record TimePoint(String day, long value) {}
    public record SkillCount(String skill, long count) {}
}
