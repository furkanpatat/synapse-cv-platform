package com.cvplatform.interview.dto;

import com.cvplatform.interview.InterviewSession;

import java.time.Instant;
import java.util.UUID;

public record InterviewDto(
        UUID id,
        UUID applicationId,
        UUID jobId,
        String jobTitle,
        UUID companyId,
        String companyName,
        UUID candidateUserId,
        String candidateName,
        String candidateEmail,
        Instant scheduledAt,
        Integer durationMin,
        String roomToken,
        String status,
        Instant startedAt,
        Instant endedAt
) {
    public static InterviewDto from(InterviewSession s) {
        var app = s.getApplication();
        var u = app.getUser();
        var job = app.getJob();
        String name = ((u.getFirstName() == null ? "" : u.getFirstName()) + " "
                + (u.getLastName() == null ? "" : u.getLastName())).trim();
        return new InterviewDto(
                s.getId(),
                app.getId(),
                job.getId(),
                job.getTitle(),
                job.getCompany().getId(),
                job.getCompany().getName(),
                u.getId(),
                name.isEmpty() ? u.getEmail() : name,
                u.getEmail(),
                s.getScheduledAt(),
                s.getDurationMin(),
                s.getRoomToken(),
                s.getStatus().name(),
                s.getStartedAt(),
                s.getEndedAt()
        );
    }
}
