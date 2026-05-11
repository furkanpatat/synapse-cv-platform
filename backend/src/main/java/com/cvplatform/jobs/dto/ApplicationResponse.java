package com.cvplatform.jobs.dto;

import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationStatus;

import java.time.Instant;
import java.util.UUID;

public record ApplicationResponse(
        UUID id,
        UUID jobId,
        String jobTitle,
        UUID userId,
        String userFirstName,
        String userLastName,
        String userEmail,
        String userTitle,
        String userCity,
        String userGithubUrl,
        ApplicationStatus status,
        Integer atsScore,
        Integer aiOverallScore,
        String coverLetter,
        Instant appliedAt,
        Instant updatedAt
) {
    public static ApplicationResponse from(Application a) {
        var user = a.getUser();
        return new ApplicationResponse(
                a.getId(),
                a.getJob().getId(),
                a.getJob().getTitle(),
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getTitle(),
                user.getCity(),
                user.getGithubUrl(),
                a.getStatus(),
                a.getAtsScore(),
                a.getAiOverallScore(),
                a.getCoverLetter(),
                a.getAppliedAt(),
                a.getUpdatedAt()
        );
    }
}
