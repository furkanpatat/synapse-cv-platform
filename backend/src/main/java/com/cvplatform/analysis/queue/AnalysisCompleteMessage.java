package com.cvplatform.analysis.queue;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/**
 * Worker result envelope returned via "analysis.complete" queue.
 * status: "COMPLETED" | "FAILED"; on FAILED the errorMessage carries the reason.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AnalysisCompleteMessage(
        String reportId,
        String userId,
        String status,
        String errorMessage,
        String githubUsername,
        Map<String, Object> github,
        Integer overallScore,
        String summary,
        List<Map<String, Object>> skillScores,
        List<Map<String, Object>> inconsistencies
) {}
