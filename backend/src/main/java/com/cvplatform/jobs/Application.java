package com.cvplatform.jobs;

import com.cvplatform.user.User;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "applications", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "job_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private JobPosting job;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.NEW;

    @Column(name = "ats_score")
    private Integer atsScore;

    @Column(name = "ai_overall_score")
    private Integer aiOverallScore;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    // ----- AI-generated CV detection (filled at analysis time) -----

    @Column(name = "cv_ai_probability")
    private Integer cvAiProbability;

    @Column(name = "cv_ai_verdict", length = 20)
    private String cvAiVerdict;

    @Type(JsonBinaryType.class)
    @Column(name = "cv_ai_signals", columnDefinition = "jsonb")
    private List<String> cvAiSignals;

    @Column(name = "cv_ai_detected_at")
    private Instant cvAiDetectedAt;

    @CreationTimestamp
    @Column(name = "applied_at", nullable = false, updatable = false)
    private Instant appliedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
