package com.cvplatform.jobs.dto;

import com.cvplatform.jobs.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record ApplicationStatusUpdate(@NotNull ApplicationStatus status) {}
