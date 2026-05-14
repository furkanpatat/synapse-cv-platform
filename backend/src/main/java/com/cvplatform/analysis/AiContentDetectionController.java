package com.cvplatform.analysis;

import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/ai-detection")
@RequiredArgsConstructor
public class AiContentDetectionController {

    private final AiContentDetector detector;
    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final CvDocumentRepository cvRepository;
    private final UserRepository userRepository;

    /**
     * Run AI-content detection for a specific application. Caches the result
     * on the Application row so re-asks are free. COMPANY-only — the
     * candidate themselves doesn't see this score (would invite gaming).
     */
    @PostMapping("/applications/{applicationId}")
    @PreAuthorize("hasRole('COMPANY')")
    @Transactional
    public ResponseEntity<Map<String, Object>> detectForApplication(
            @AuthenticationPrincipal User owner,
            @PathVariable UUID applicationId) {

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("APPLICATION_NOT_FOUND",
                        "Başvuru bulunamadı"));
        Company company = companyRepository.findByOwner_Id(owner.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "Şirket kaydı yok"));
        if (!app.getJob().getCompany().getId().equals(company.getId())) {
            throw ApiException.forbidden("APPLICATION_NOT_OWNED",
                    "Bu başvuru senin şirketine ait değil");
        }

        // Return cached result if we have one (CV-content rarely changes per
        // application; the company can re-run by passing ?force=true).
        if (app.getCvAiVerdict() != null && app.getCvAiDetectedAt() != null) {
            return ResponseEntity.ok(asResponse(app));
        }

        CvDocument cv = cvRepository
                .findFirstByUserIdOrderByCreatedAtDesc(app.getUser().getId())
                .orElse(null);
        String cvText = cv == null ? "" : cv.getRawText();
        String bio = userRepository.findById(app.getUser().getId())
                .map(User::getBio).orElse("");

        AiContentDetector.Result r = detector.detect(cvText, bio);
        app.setCvAiProbability(r.probability());
        app.setCvAiVerdict(r.verdict().name());
        app.setCvAiSignals(r.signals());
        app.setCvAiDetectedAt(Instant.now());
        applicationRepository.save(app);

        return ResponseEntity.ok(asResponse(app, r.reason()));
    }

    private static Map<String, Object> asResponse(Application app) {
        return asResponse(app, null);
    }

    private static Map<String, Object> asResponse(Application app, String reason) {
        return Map.of(
                "probability", app.getCvAiProbability() == null ? 0 : app.getCvAiProbability(),
                "verdict", app.getCvAiVerdict(),
                "signals", app.getCvAiSignals() == null ? java.util.List.of() : app.getCvAiSignals(),
                "detectedAt", app.getCvAiDetectedAt(),
                "reason", reason == null ? "" : reason
        );
    }
}
