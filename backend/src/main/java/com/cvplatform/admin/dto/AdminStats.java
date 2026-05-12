package com.cvplatform.admin.dto;

public record AdminStats(
        long totalUsers,
        long totalCompanies,
        long verifiedCompanies,
        long pendingCompanies,
        long bannedUsers,
        long totalJobs,
        long activeJobs,
        long totalApplications
) {}
