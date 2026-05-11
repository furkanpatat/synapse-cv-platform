package com.cvplatform.jobs;

import com.cvplatform.jobs.dto.JobRequest;
import com.cvplatform.jobs.dto.JobResponse;
import com.cvplatform.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/company/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('COMPANY')")
public class CompanyJobController {

    private final CompanyJobService service;

    @GetMapping
    public ResponseEntity<List<JobResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listMyJobs(user));
    }

    @PostMapping
    public ResponseEntity<JobResponse> create(@AuthenticationPrincipal User user,
                                              @Valid @RequestBody JobRequest req) {
        return ResponseEntity.ok(service.create(user, req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> get(@AuthenticationPrincipal User user,
                                           @PathVariable UUID id) {
        return ResponseEntity.ok(service.get(user, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobResponse> update(@AuthenticationPrincipal User user,
                                              @PathVariable UUID id,
                                              @Valid @RequestBody JobRequest req) {
        return ResponseEntity.ok(service.update(user, id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user,
                                       @PathVariable UUID id) {
        service.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
