package com.cvplatform.analysis;

import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/analysis")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping("/start")
    public ResponseEntity<AnalysisReport> start(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analysisService.startAnalysis(user.getId()));
    }

    @GetMapping("/me")
    public ResponseEntity<AnalysisReport> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analysisService.getMyLatest(user.getId()));
    }
}
