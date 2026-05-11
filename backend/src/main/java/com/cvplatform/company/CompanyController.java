package com.cvplatform.company;

import com.cvplatform.common.ApiException;
import com.cvplatform.company.dto.CompanyProfileRequest;
import com.cvplatform.company.dto.CompanyResponse;
import com.cvplatform.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/companies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('COMPANY')")
public class CompanyController {

    private final CompanyRepository companyRepository;

    @GetMapping("/me")
    public ResponseEntity<CompanyResponse> getMyCompany(@AuthenticationPrincipal User user) {
        Company company = companyRepository.findByOwner_Id(user.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "No company associated with this account"));
        return ResponseEntity.ok(CompanyResponse.from(company));
    }

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<CompanyResponse> updateMyCompany(@AuthenticationPrincipal User user,
                                                           @Valid @RequestBody CompanyProfileRequest req) {
        Company company = companyRepository.findByOwner_Id(user.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "No company associated with this account"));
        if (req.name() != null) company.setName(req.name());
        if (req.taxNo() != null) company.setTaxNo(req.taxNo());
        if (req.sector() != null) company.setSector(req.sector());
        if (req.website() != null) company.setWebsite(req.website());
        if (req.logoUrl() != null) company.setLogoUrl(req.logoUrl());
        if (req.description() != null) company.setDescription(req.description());
        company = companyRepository.save(company);
        return ResponseEntity.ok(CompanyResponse.from(company));
    }
}
