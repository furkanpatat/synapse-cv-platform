package com.cvplatform.analysis.queue;

import java.util.List;

/** Sent to "analysis.run" queue; consumed by ai-service worker. */
public record AnalysisJobMessage(
        String reportId,
        String userId,
        String githubUsername,
        List<String> cvSkills
) {}
