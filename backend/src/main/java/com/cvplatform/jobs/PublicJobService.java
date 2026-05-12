package com.cvplatform.jobs;

import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.common.ApiException;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.jobs.dto.ApplicationResponse;
import com.cvplatform.jobs.dto.ApplyRequest;
import com.cvplatform.jobs.dto.JobResponse;
import com.cvplatform.notifications.NotificationService;
import com.cvplatform.notifications.NotificationType;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicJobService {

    private final JobPostingRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final CvDocumentRepository cvRepository;
    private final AnalysisReportRepository analysisRepository;
    private final UserRepository userRepository;
    private final com.cvplatform.subscription.QuotaService quotaService;
    private final NotificationService notificationService;
    private final EmbeddingClient embeddingClient;

    public Page<JobResponse> listActive(int page, int size) {
        Page<JobPosting> jobs = jobRepository.findAllByStatus(
                JobStatus.ACTIVE,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return jobs.map(j -> JobResponse.from(j, applicationRepository.countByJob_Id(j.getId())));
    }

    @Transactional
    public JobResponse getAndCountView(UUID jobId) {
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("JOB_NOT_FOUND", "Job not found"));
        if (job.getStatus() != JobStatus.ACTIVE) {
            throw ApiException.notFound("JOB_NOT_ACTIVE", "Job is not active");
        }
        job.setViewCount((job.getViewCount() == null ? 0 : job.getViewCount()) + 1);
        job = jobRepository.save(job);
        return JobResponse.from(job, applicationRepository.countByJob_Id(jobId));
    }

    @Transactional
    public ApplicationResponse apply(UUID userId, ApplyRequest req) {
        User user = userRepository.findById(userId).orElseThrow();
        quotaService.checkApplyQuota(user);
        JobPosting job = jobRepository.findById(req.jobId())
                .orElseThrow(() -> ApiException.notFound("JOB_NOT_FOUND", "Job not found"));
        if (job.getStatus() != JobStatus.ACTIVE) {
            throw ApiException.badRequest("JOB_NOT_ACTIVE", "This posting is not accepting applications");
        }
        if (applicationRepository.findByUser_IdAndJob_Id(userId, job.getId()).isPresent()) {
            throw ApiException.conflict("ALREADY_APPLIED", "You have already applied to this job");
        }

        Integer atsScore = calculateAtsScore(userId, job);
        Integer aiScore = analysisRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .map(AnalysisReport::getOverallScore)
                .orElse(null);

        Application app = Application.builder()
                .user(user)
                .job(job)
                .status(ApplicationStatus.NEW)
                .atsScore(atsScore)
                .aiOverallScore(aiScore)
                .coverLetter(req.coverLetter())
                .build();
        app = applicationRepository.save(app);

        // Notify the company owner that a new application has arrived
        try {
            UUID ownerId = job.getCompany().getOwner().getId();
            String candidateName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                    + (user.getLastName() == null ? "" : user.getLastName())).trim();
            String name = candidateName.isEmpty() ? user.getEmail() : candidateName;
            notificationService.notify(
                    ownerId,
                    NotificationType.NEW_APPLICATION,
                    "Yeni başvuru: " + job.getTitle(),
                    name + " bu ilana başvurdu" + (aiScore != null ? " · AI skor " + aiScore : ""),
                    "/company/applications/" + app.getId()
            );
        } catch (Exception ignored) {
            // notification is non-critical
        }

        return ApplicationResponse.from(app);
    }

    public List<ApplicationResponse> myApplications(UUID userId) {
        return applicationRepository.findAllByUser_IdOrderByAppliedAtDesc(userId).stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    public List<JobResponse> recommendedForUser(UUID userId, int limit) {
        CvDocument cv = cvRepository.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        List<String> mySkillsList = cv == null || cv.getSkills() == null ? List.of() : cv.getSkills();

        Page<JobPosting> active = jobRepository.findAllByStatus(
                JobStatus.ACTIVE,
                PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        List<JobPosting> activeList = active.getContent();
        if (activeList.isEmpty()) return List.of();

        if (mySkillsList.isEmpty()) {
            return activeList.stream()
                    .limit(limit)
                    .map(j -> JobResponse.from(j, applicationRepository.countByJob_Id(j.getId())))
                    .toList();
        }

        List<EmbeddingClient.CandidateBody> candidates = activeList.stream()
                .map(j -> new EmbeddingClient.CandidateBody(
                        j.getId().toString(),
                        j.getRequiredSkills() == null ? List.of() : j.getRequiredSkills(),
                        j.getTitle()
                ))
                .toList();

        List<EmbeddingClient.MatchHit> hits = embeddingClient.match(mySkillsList, candidates, limit);
        if (hits.isEmpty()) {
            Set<String> mySet = normalizeSkills(mySkillsList);
            return activeList.stream()
                    .sorted((a, b) -> Integer.compare(
                            overlap(normalizeSkills(b.getRequiredSkills()), mySet),
                            overlap(normalizeSkills(a.getRequiredSkills()), mySet)))
                    .limit(limit)
                    .map(j -> JobResponse.from(j, applicationRepository.countByJob_Id(j.getId())))
                    .toList();
        }

        Map<UUID, JobPosting> byId = activeList.stream()
                .collect(Collectors.toMap(JobPosting::getId, j -> j));
        return hits.stream()
                .map(h -> byId.get(UUID.fromString(h.id())))
                .filter(Objects::nonNull)
                .map(j -> JobResponse.from(j, applicationRepository.countByJob_Id(j.getId())))
                .toList();
    }

    // ============ helpers ============

    private Integer calculateAtsScore(UUID userId, JobPosting job) {
        CvDocument cv = cvRepository.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        if (cv == null || job.getRequiredSkills() == null || job.getRequiredSkills().isEmpty()) {
            return null;
        }
        Set<String> mySkills = normalizeSkills(cv.getSkills());
        Set<String> required = normalizeSkills(job.getRequiredSkills());
        if (required.isEmpty()) return null;
        int matched = 0;
        for (String r : required) {
            if (mySkills.contains(r)) matched++;
        }
        return (int) Math.round(100.0 * matched / required.size());
    }

    private static Set<String> normalizeSkills(List<String> input) {
        if (input == null) return Set.of();
        return input.stream()
                .filter(Objects::nonNull)
                .map(s -> s.toLowerCase(Locale.ROOT).trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private static int overlap(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) return 0;
        int count = 0;
        for (String x : a) if (b.contains(x)) count++;
        return count;
    }
}
