package com.cvplatform.jobs.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ApplyRequest(
        @NotNull UUID jobId,
        @Size(max = 5000) String coverLetter
) {}
