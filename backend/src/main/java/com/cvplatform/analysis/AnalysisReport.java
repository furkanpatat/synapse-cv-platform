package com.cvplatform.analysis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Document(collection = "analysis_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisReport {

    @Id
    private String id;

    @Indexed
    private UUID userId;

    private String githubUsername;
    private GithubSummary github;

    private List<SkillScore> skillScores;
    private Integer overallScore;
    private List<Inconsistency> inconsistencies;
    private String summary;

    @CreatedDate
    private Instant createdAt;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class GithubSummary {
        private Integer publicRepos;
        private Integer totalStars;
        private Map<String, Long> languageBytes;   // language -> bytes
        private List<RepoBrief> topRepos;
        private String accountCreatedAt;
        private String lastActivityAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RepoBrief {
        private String name;
        private String description;
        private String primaryLanguage;
        private Integer stars;
        private String updatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SkillScore {
        private String skill;
        private Integer score;          // 0-100
        private String confidence;      // LOW | MEDIUM | HIGH
        private String explanation;
        private List<String> evidenceRepos;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Inconsistency {
        private String claimedSkill;
        private String issue;
        private String severity;        // LOW | MEDIUM | HIGH
    }
}
