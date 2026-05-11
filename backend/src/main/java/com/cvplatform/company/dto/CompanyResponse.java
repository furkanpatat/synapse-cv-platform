package com.cvplatform.company.dto;

import com.cvplatform.company.Company;

import java.time.Instant;
import java.util.UUID;

public record CompanyResponse(
        UUID id,
        UUID ownerUserId,
        String name,
        String taxNo,
        String sector,
        String website,
        String logoUrl,
        String description,
        boolean verified,
        Instant createdAt
) {
    public static CompanyResponse from(Company c) {
        return new CompanyResponse(
                c.getId(),
                c.getOwner().getId(),
                c.getName(),
                c.getTaxNo(),
                c.getSector(),
                c.getWebsite(),
                c.getLogoUrl(),
                c.getDescription(),
                c.isVerified(),
                c.getCreatedAt()
        );
    }
}
