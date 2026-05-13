package com.cvplatform.jobs;

import com.cvplatform.common.ApiException;
import com.cvplatform.jobs.dto.JobResponse;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class SavedJobController {

    private final SavedJobRepository savedJobRepository;
    private final JobPostingRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    @PostMapping("/{id}/save")
    @Transactional
    public ResponseEntity<Map<String, Boolean>> save(@AuthenticationPrincipal User user,
                                                     @PathVariable UUID id) {
        if (savedJobRepository.existsByUser_IdAndJob_Id(user.getId(), id)) {
            return ResponseEntity.ok(Map.of("saved", true));
        }
        JobPosting job = jobRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("JOB_NOT_FOUND", "Job not found"));
        User managed = userRepository.findById(user.getId()).orElseThrow();
        savedJobRepository.save(SavedJob.builder().user(managed).job(job).build());
        return ResponseEntity.ok(Map.of("saved", true));
    }

    @DeleteMapping("/{id}/save")
    @Transactional
    public ResponseEntity<Map<String, Boolean>> unsave(@AuthenticationPrincipal User user,
                                                       @PathVariable UUID id) {
        savedJobRepository.deleteByUser_IdAndJob_Id(user.getId(), id);
        return ResponseEntity.ok(Map.of("saved", false));
    }

    @GetMapping("/saved-ids")
    public ResponseEntity<List<UUID>> savedIds(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(savedJobRepository.findJobIdsByUser(user.getId()));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<JobResponse>> saved(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                savedJobRepository.findAllByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                        .map(s -> JobResponse.from(s.getJob(),
                                applicationRepository.countByJob_Id(s.getJob().getId())))
                        .toList()
        );
    }
}
