package com.cvplatform.admin.dto;

import com.cvplatform.company.Company;

import java.time.Instant;
import java.util.UUID;

public record AdminCompanyDto(
        UUID id,
        String name,
        String taxNo,
        String sector,
        boolean verified,
        UUID ownerUserId,
        String ownerEmail,
        Instant createdAt
) {
    public static AdminCompanyDto from(Company c) {
        return new AdminCompanyDto(
                c.getId(), c.getName(), c.getTaxNo(), c.getSector(),
                c.isVerified(), c.getOwner().getId(), c.getOwner().getEmail(),
                c.getCreatedAt()
        );
    }
}
