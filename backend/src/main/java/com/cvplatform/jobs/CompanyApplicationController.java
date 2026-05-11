package com.cvplatform.jobs;

import com.cvplatform.jobs.dto.ApplicationResponse;
import com.cvplatform.jobs.dto.ApplicationStatusUpdate;
import com.cvplatform.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/company")
@RequiredArgsConstructor
@PreAuthorize("hasRole('COMPANY')")
public class CompanyApplicationController {

    private final CompanyApplicationService service;

    @GetMapping("/jobs/{jobId}/applications")
    public ResponseEntity<List<ApplicationResponse>> listForJob(@AuthenticationPrincipal User user,
                                                                @PathVariable UUID jobId) {
        return ResponseEntity.ok(service.listForJob(user, jobId));
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<Map<String, Object>> detail(@AuthenticationPrincipal User user,
                                                      @PathVariable UUID id) {
        return ResponseEntity.ok(service.getDetail(user, id));
    }

    @PutMapping("/applications/{id}/status")
    public ResponseEntity<ApplicationResponse> updateStatus(@AuthenticationPrincipal User user,
                                                            @PathVariable UUID id,
                                                            @Valid @RequestBody ApplicationStatusUpdate req) {
        return ResponseEntity.ok(service.updateStatus(user, id, req));
    }
}
