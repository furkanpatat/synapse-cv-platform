package com.cvplatform.company.dto;

import jakarta.validation.constraints.Size;

public record CompanyProfileRequest(
        @Size(max = 255) String name,
        @Size(max = 50) String taxNo,
        @Size(max = 100) String sector,
        @Size(max = 500) String website,
        @Size(max = 500) String logoUrl,
        @Size(max = 5000) String description
) {}
