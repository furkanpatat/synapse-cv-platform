package com.cvplatform.interview;

import com.cvplatform.jobs.Application;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "interview_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "duration_min", nullable = false)
    @Builder.Default
    private Integer durationMin = 45;

    @Column(name = "room_token", nullable = false, unique = true, length = 32)
    private String roomToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.SCHEDULED;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ----- post-interview AI evaluation -----

    @Column(name = "candidate_transcript", columnDefinition = "TEXT")
    private String candidateTranscript;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "ai_overall_score")
    private Integer aiOverallScore;

    @Type(JsonBinaryType.class)
    @Column(name = "ai_strengths", columnDefinition = "jsonb")
    private List<String> aiStrengths;

    @Type(JsonBinaryType.class)
    @Column(name = "ai_gaps", columnDefinition = "jsonb")
    private List<String> aiGaps;

    @Column(name = "ai_recommendation", length = 16)
    private String aiRecommendation;

    @Column(name = "ai_evaluated_at")
    private Instant aiEvaluatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Status { SCHEDULED, STARTED, ENDED, CANCELLED }
}
