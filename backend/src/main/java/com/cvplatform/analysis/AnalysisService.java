package com.cvplatform.analysis;

import com.cvplatform.analysis.queue.AnalysisJobMessage;
import com.cvplatform.analysis.queue.AnalysisJobProducer;
import com.cvplatform.common.ApiException;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.subscription.QuotaService;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private static final Pattern GITHUB_PATTERN =
            Pattern.compile("(?:https?://)?(?:www\\.)?github\\.com/([A-Za-z0-9-]+)/?.*");

    private final AnalysisReportRepository reportRepository;
    private final CvDocumentRepository cvRepository;
    private final UserRepository userRepository;
    private final QuotaService quotaService;
    private final AnalysisJobProducer jobProducer;

    /**
     * Validates and enqueues an analysis job. Returns immediately with a PENDING
     * placeholder report. The ai-service worker consumes the job, performs GitHub
     * fetch + Gemini skill verification, then publishes back to "analysis.complete"
     * which is handled by AnalysisCompleteListener.
     */
    @Transactional
    public AnalysisReport startAnalysis(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        quotaService.checkAnalysisQuota(user);
        String githubUsername = extractGithubUsername(user.getGithubUrl());
        if (githubUsername == null) {
            throw ApiException.badRequest("GITHUB_NOT_SET",
                    "Add your GitHub profile URL before running analysis");
        }

        CvDocument cv = cvRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> ApiException.badRequest("CV_NOT_FOUND",
                        "Upload a CV before running analysis"));
        if (cv.getStatus() != CvDocument.CvStatus.PARSED) {
            throw ApiException.badRequest("CV_NOT_PARSED",
                    "CV must be parsed successfully before analysis");
        }
        List<String> cvSkills = cv.getSkills() == null ? List.of() : cv.getSkills();

        // Persist PENDING placeholder
        AnalysisReport pending = AnalysisReport.builder()
                .userId(userId)
                .githubUsername(githubUsername)
                .status(AnalysisReport.Status.PENDING)
                .build();
        AnalysisReport saved = reportRepository.save(pending);

        // Hand off to worker
        try {
            jobProducer.enqueue(new AnalysisJobMessage(
                    saved.getId(),
                    userId.toString(),
                    githubUsername,
                    cvSkills
            ));
        } catch (Exception ex) {
            log.error("Failed to enqueue analysis job: {}", ex.getMessage(), ex);
            saved.setStatus(AnalysisReport.Status.FAILED);
            saved.setErrorMessage("Job kuyruğuna gönderilemedi: " + ex.getMessage());
            reportRepository.save(saved);
        }
        return saved;
    }

    public AnalysisReport getMyLatest(UUID userId) {
        return reportRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> ApiException.notFound("ANALYSIS_NOT_FOUND",
                        "No analysis report yet"));
    }

    static String extractGithubUsername(String urlOrName) {
        if (urlOrName == null || urlOrName.isBlank()) return null;
        String trimmed = urlOrName.trim();
        Matcher m = GITHUB_PATTERN.matcher(trimmed);
        if (m.matches()) return m.group(1);
        if (trimmed.matches("[A-Za-z0-9-]+")) return trimmed;
        return null;
    }
}
