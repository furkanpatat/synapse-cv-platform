package com.cvplatform.user;

import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.common.ApiException;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Public read-only profile endpoint. Anyone (no auth) can fetch
 * a user's public-facing CV summary + AI score using the email handle
 * (e.g. "furkanpatat" from "furkanpatat@hotmail.com").
 *
 * Excludes PII like email, phone, tax_no.
 */
@RestController
@RequestMapping("/v1/public/users")
@RequiredArgsConstructor
public class PublicProfileController {

    private final UserRepository userRepository;
    private final CvDocumentRepository cvRepository;
    private final AnalysisReportRepository analysisRepository;

    @GetMapping("/{handle}")
    public ResponseEntity<PublicProfileDto> get(@PathVariable String handle) {
        // Resolve handle = email local-part; fall back to exact email match.
        User user = userRepository.findAll().stream()
                .filter(u -> emailHandle(u.getEmail()).equalsIgnoreCase(handle)
                        || u.getEmail().equalsIgnoreCase(handle))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("PROFILE_NOT_FOUND", "Profile not found"));

        if (user.isBanned()) {
            throw ApiException.notFound("PROFILE_NOT_FOUND", "Profile not found");
        }

        UUID userId = user.getId();
        CvDocument cv = cvRepository.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        AnalysisReport analysis = analysisRepository
                .findFirstByUserIdOrderByCreatedAtDesc(userId)
                .filter(r -> r.getStatus() == null || r.getStatus() == AnalysisReport.Status.COMPLETED)
                .orElse(null);

        return ResponseEntity.ok(new PublicProfileDto(
                emailHandle(user.getEmail()),
                user.getFirstName(),
                user.getLastName(),
                user.getTitle(),
                user.getCity(),
                user.getBio(),
                user.getGithubUrl(),
                user.getLinkedinUrl(),
                user.getRole().name(),
                cv == null ? null : cv.getSummary(),
                cv == null ? List.of() : (cv.getSkills() == null ? List.of() : cv.getSkills()),
                analysis == null ? null : analysis.getOverallScore(),
                analysis == null ? null : analysis.getSummary(),
                analysis == null ? null : analysis.getGithubUsername(),
                analysis == null || analysis.getGithub() == null ? null : analysis.getGithub().getPublicRepos(),
                analysis == null || analysis.getGithub() == null ? null : analysis.getGithub().getTotalStars(),
                analysis == null ? null : analysis.getCreatedAt()
        ));
    }

    private static String emailHandle(String email) {
        if (email == null) return "";
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    public record PublicProfileDto(
            String handle,
            String firstName,
            String lastName,
            String title,
            String city,
            String bio,
            String githubUrl,
            String linkedinUrl,
            String role,
            String cvSummary,
            List<String> skills,
            Integer aiOverallScore,
            String aiSummary,
            String githubUsername,
            Integer publicRepos,
            Integer totalStars,
            Instant aiGeneratedAt
    ) {}
}
