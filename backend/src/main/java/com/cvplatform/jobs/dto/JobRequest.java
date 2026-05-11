package com.cvplatform.jobs.dto;

import com.cvplatform.jobs.JobLevel;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.jobs.RemoteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record JobRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank String description,
        @Size(max = 100) String city,
        RemoteType remoteType,
        JobLevel level,
        Integer salaryMin,
        Integer salaryMax,
        @Size(max = 8) String currency,
        List<String> requiredSkills,
        JobStatus status
) {}
