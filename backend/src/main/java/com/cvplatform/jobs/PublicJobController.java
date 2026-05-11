package com.cvplatform.jobs;

import com.cvplatform.jobs.dto.ApplicationResponse;
import com.cvplatform.jobs.dto.ApplyRequest;
import com.cvplatform.jobs.dto.JobResponse;
import com.cvplatform.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/jobs")
@RequiredArgsConstructor
public class PublicJobController {

    private final PublicJobService service;

    @GetMapping
    public ResponseEntity<Page<JobResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listActive(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getAndCountView(id));
    }

    @GetMapping("/recommended")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<JobResponse>> recommended(@AuthenticationPrincipal User user,
                                                         @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(service.recommendedForUser(user.getId(), limit));
    }
}

@RestController
@RequestMapping("/v1/applications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
class UserApplicationController {

    private final PublicJobService service;

    @PostMapping
    public ResponseEntity<ApplicationResponse> apply(@AuthenticationPrincipal User user,
                                                     @Valid @RequestBody ApplyRequest req) {
        return ResponseEntity.ok(service.apply(user.getId(), req));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ApplicationResponse>> mine(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.myApplications(user.getId()));
    }
}
