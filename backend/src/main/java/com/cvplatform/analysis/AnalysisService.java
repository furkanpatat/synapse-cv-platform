package com.cvplatform.analysis;

import com.cvplatform.common.ApiException;
import com.cvplatform.cv.AiServiceClient;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.notifications.NotificationService;
import com.cvplatform.notifications.NotificationType;
import com.cvplatform.subscription.QuotaService;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
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
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;
    private final QuotaService quotaService;
    private final NotificationService notificationService;

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

        Map<String, Object> aiResult = aiServiceClient.runAnalysis(userId, githubUsername, cvSkills);
        AnalysisReport report = objectMapper.convertValue(aiResult, AnalysisReport.class);
        report.setId(null);
        report.setUserId(userId);
        report.setGithubUsername(githubUsername);
        AnalysisReport saved = reportRepository.save(report);

        try {
            notificationService.notify(
                    userId,
                    NotificationType.ANALYSIS_COMPLETE,
                    "AI yetkinlik raporun hazır ✨",
                    "Genel skor " + (saved.getOverallScore() == null ? "—" : saved.getOverallScore())
                            + "/100 — detayları görüntüle.",
                    "/dashboard/analysis"
            );
        } catch (Exception ignored) {}

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
