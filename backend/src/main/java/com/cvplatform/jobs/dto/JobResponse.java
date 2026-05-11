package com.cvplatform.jobs.dto;

import com.cvplatform.jobs.JobLevel;
import com.cvplatform.jobs.JobPosting;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.jobs.RemoteType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record JobResponse(
        UUID id,
        UUID companyId,
        String companyName,
        String title,
        String description,
        String city,
        RemoteType remoteType,
        JobLevel level,
        Integer salaryMin,
        Integer salaryMax,
        String currency,
        List<String> requiredSkills,
        JobStatus status,
        Integer viewCount,
        long applicationCount,
        Instant expiresAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static JobResponse from(JobPosting j, long applicationCount) {
        return new JobResponse(
                j.getId(),
                j.getCompany().getId(),
                j.getCompany().getName(),
                j.getTitle(),
                j.getDescription(),
                j.getCity(),
                j.getRemoteType(),
                j.getLevel(),
                j.getSalaryMin(),
                j.getSalaryMax(),
                j.getCurrency(),
                j.getRequiredSkills(),
                j.getStatus(),
                j.getViewCount(),
                applicationCount,
                j.getExpiresAt(),
                j.getCreatedAt(),
                j.getUpdatedAt()
        );
    }
}
