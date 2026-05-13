package com.cvplatform.analysis.queue;

import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.notifications.NotificationService;
import com.cvplatform.notifications.NotificationType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalysisCompleteListener {

    private final AnalysisReportRepository reportRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitConfig.ANALYSIS_COMPLETE_QUEUE)
    public void handle(AnalysisCompleteMessage msg) {
        log.info("analysis.complete received report={} status={}", msg.reportId(), msg.status());
        Optional<AnalysisReport> opt = reportRepository.findById(msg.reportId());
        if (opt.isEmpty()) {
            log.warn("Report {} no longer exists, dropping complete message", msg.reportId());
            return;
        }
        AnalysisReport report = opt.get();

        if ("FAILED".equalsIgnoreCase(msg.status())) {
            report.setStatus(AnalysisReport.Status.FAILED);
            report.setErrorMessage(msg.errorMessage() == null ? "Analysis failed" : msg.errorMessage());
            report.setCompletedAt(Instant.now());
            reportRepository.save(report);

            UUID userId = report.getUserId();
            try {
                notificationService.notify(
                        userId,
                        NotificationType.ANALYSIS_COMPLETE,
                        "AI yetkinlik analizi başarısız ❌",
                        report.getErrorMessage(),
                        "/dashboard/analysis"
                );
            } catch (Exception ignored) {}
            return;
        }

        // Success — fill out the report
        report.setStatus(AnalysisReport.Status.COMPLETED);
        report.setErrorMessage(null);
        report.setGithubUsername(msg.githubUsername());
        report.setOverallScore(msg.overallScore());
        report.setSummary(msg.summary());

        if (msg.github() != null) {
            report.setGithub(objectMapper.convertValue(msg.github(), AnalysisReport.GithubSummary.class));
        }
        if (msg.skillScores() != null) {
            List<AnalysisReport.SkillScore> ss = msg.skillScores().stream()
                    .map(m -> objectMapper.convertValue(m, AnalysisReport.SkillScore.class))
                    .toList();
            report.setSkillScores(ss);
        }
        if (msg.inconsistencies() != null) {
            List<AnalysisReport.Inconsistency> ii = msg.inconsistencies().stream()
                    .map(m -> objectMapper.convertValue(m, AnalysisReport.Inconsistency.class))
                    .toList();
            report.setInconsistencies(ii);
        }
        report.setCompletedAt(Instant.now());
        AnalysisReport saved = reportRepository.save(report);

        try {
            UUID userId = saved.getUserId();
            notificationService.notify(
                    userId,
                    NotificationType.ANALYSIS_COMPLETE,
                    "AI yetkinlik raporun hazır ✨",
                    "Genel skor " + (saved.getOverallScore() == null ? "—" : saved.getOverallScore())
                            + "/100 — detayları görüntüle.",
                    "/dashboard/analysis"
            );
        } catch (Exception ex) {
            log.warn("Failed to push notification after analysis: {}", ex.getMessage());
        }
    }

    /** Convenience for any other consumer that needs Map decoding. */
    @SuppressWarnings("unused")
    private Map<String, Object> emptyMap() {
        return Map.of();
    }
}
