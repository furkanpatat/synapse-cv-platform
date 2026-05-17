package com.cvplatform.cv;

import com.cvplatform.common.ApiException;
import com.cvplatform.cv.dto.CvUpdateRequest;
import com.cvplatform.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CvService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword"
    );
    private static final long MAX_SIZE_BYTES = 10L * 1024 * 1024;

    private final StorageService storageService;
    private final CvDocumentRepository cvRepository;
    private final AiServiceClient aiServiceClient;

    public CvDocument uploadAndParse(UUID userId, MultipartFile file) {
        validate(file);

        String objectName;
        try {
            objectName = storageService.upload(file, "cv/" + userId);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store uploaded file", ex);
        }

        CvDocument doc = CvDocument.builder()
                .userId(userId)
                .originalFilename(file.getOriginalFilename())
                .fileObjectName(objectName)
                .status(CvDocument.CvStatus.PENDING)
                .build();
        doc = cvRepository.save(doc);

        try {
            AiServiceClient.ParseResponse parsed = aiServiceClient.parseCv(userId, objectName);
            applyParseResult(doc, parsed);
            doc.setStatus(CvDocument.CvStatus.PARSED);
            doc.setErrorMessage(null);
        } catch (Exception ex) {
            log.error("CV parse failed for user {}: {}", userId, ex.getMessage(), ex);
            doc.setStatus(CvDocument.CvStatus.FAILED);
            doc.setErrorMessage(ex.getMessage());
        }

        return cvRepository.save(doc);
    }

    public CvDocument getMyCv(UUID userId) {
        return cvRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> ApiException.notFound("CV_NOT_FOUND",
                        "No CV uploaded for this user"));
    }

    public CvDocument updateMyCv(UUID userId, CvUpdateRequest req) {
        CvDocument doc = getMyCv(userId);
        applyManualFields(doc, req);
        rebuildRawText(doc);
        return cvRepository.save(doc);
    }

    /**
     * Builder-mode upsert: lets the user create or replace their CV by
     * filling out the in-app form (no file upload). If they already have
     * a CV we update it in place; otherwise we mint a fresh CvDocument
     * with PARSED status so the rest of the AI pipeline (analysis,
     * match, skill graph, …) treats it like any uploaded CV.
     *
     * We always regenerate rawText from the structured fields — the AI
     * verifier reads rawText, so keeping it in sync is essential.
     */
    public CvDocument createOrReplaceManual(UUID userId, CvUpdateRequest req) {
        CvDocument doc = cvRepository
                .findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElseGet(() -> CvDocument.builder()
                        .userId(userId)
                        .originalFilename("manual-cv.txt")
                        .status(CvDocument.CvStatus.PARSED)
                        .build());
        applyManualFields(doc, req);
        // No source file for builder-mode CVs.
        doc.setFileObjectName(null);
        if (doc.getStatus() == null) doc.setStatus(CvDocument.CvStatus.PARSED);
        rebuildRawText(doc);
        return cvRepository.save(doc);
    }

    private void applyManualFields(CvDocument doc, CvUpdateRequest req) {
        if (req.personal() != null) doc.setPersonal(req.personal());
        if (req.summary() != null) doc.setSummary(req.summary());
        if (req.skills() != null) doc.setSkills(req.skills());
        if (req.education() != null) doc.setEducation(req.education());
        if (req.experience() != null) doc.setExperience(req.experience());
        if (req.projects() != null) doc.setProjects(req.projects());
        if (req.languages() != null) doc.setLanguages(req.languages());
    }

    /**
     * Concatenate the structured fields back into a plain-text CV so the
     * downstream AI services (verifier, AI-CV detector, embedding match)
     * keep working on builder-created CVs identically to uploaded ones.
     */
    private void rebuildRawText(CvDocument doc) {
        StringBuilder sb = new StringBuilder();
        if (doc.getPersonal() != null) {
            CvDocument.Personal p = doc.getPersonal();
            if (p.getName() != null) sb.append(p.getName()).append('\n');
            if (p.getEmail() != null) sb.append(p.getEmail()).append(' ');
            if (p.getPhone() != null) sb.append(p.getPhone()).append(' ');
            if (p.getLocation() != null) sb.append(p.getLocation());
            sb.append("\n\n");
        }
        if (doc.getSummary() != null && !doc.getSummary().isBlank()) {
            sb.append("ÖZET\n").append(doc.getSummary()).append("\n\n");
        }
        if (doc.getSkills() != null && !doc.getSkills().isEmpty()) {
            sb.append("YETKİNLİKLER\n").append(String.join(", ", doc.getSkills())).append("\n\n");
        }
        if (doc.getExperience() != null && !doc.getExperience().isEmpty()) {
            sb.append("DENEYİM\n");
            for (CvDocument.Experience x : doc.getExperience()) {
                sb.append("• ").append(safe(x.getRole()))
                        .append(" — ").append(safe(x.getCompany()))
                        .append(" (").append(safe(x.getStartDate()))
                        .append(" – ").append(safe(x.getEndDate())).append(")\n");
                if (x.getDescription() != null && !x.getDescription().isBlank()) {
                    sb.append(x.getDescription()).append('\n');
                }
            }
            sb.append('\n');
        }
        if (doc.getEducation() != null && !doc.getEducation().isEmpty()) {
            sb.append("EĞİTİM\n");
            for (CvDocument.Education e : doc.getEducation()) {
                sb.append("• ").append(safe(e.getDegree()))
                        .append(' ').append(safe(e.getField()))
                        .append(" — ").append(safe(e.getSchool()))
                        .append(" (").append(safe(e.getStartYear()))
                        .append(" – ").append(safe(e.getEndYear())).append(")\n");
            }
            sb.append('\n');
        }
        if (doc.getProjects() != null && !doc.getProjects().isEmpty()) {
            sb.append("PROJELER\n");
            for (CvDocument.Project pr : doc.getProjects()) {
                sb.append("• ").append(safe(pr.getName())).append('\n');
                if (pr.getDescription() != null) sb.append(pr.getDescription()).append('\n');
                if (pr.getTechnologies() != null && !pr.getTechnologies().isEmpty()) {
                    sb.append("Teknolojiler: ")
                            .append(String.join(", ", pr.getTechnologies())).append('\n');
                }
            }
            sb.append('\n');
        }
        if (doc.getLanguages() != null && !doc.getLanguages().isEmpty()) {
            sb.append("DİLLER\n").append(String.join(", ", doc.getLanguages())).append('\n');
        }
        doc.setRawText(sb.toString().trim());
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    public String getDownloadUrl(CvDocument doc) {
        if (doc.getFileObjectName() == null) return null;
        return storageService.presignedDownloadUrl(doc.getFileObjectName(), 3600);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("FILE_EMPTY", "Uploaded file is empty");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw ApiException.badRequest("FILE_TOO_LARGE", "File exceeds 10MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw ApiException.badRequest("INVALID_FILE_TYPE",
                    "Only PDF and DOCX files are allowed");
        }
    }

    private void applyParseResult(CvDocument doc, AiServiceClient.ParseResponse r) {
        doc.setRawText(r.rawText());
        doc.setSummary(r.summary());
        doc.setSkills(r.skills());
        doc.setLanguages(r.languages());
        if (r.personal() != null) {
            doc.setPersonal(new CvDocument.Personal(
                    r.personal().name(), r.personal().email(),
                    r.personal().phone(), r.personal().location()));
        }
        if (r.education() != null) {
            doc.setEducation(r.education().stream()
                    .map(e -> new CvDocument.Education(
                            e.school(), e.degree(), e.field(), e.startYear(), e.endYear()))
                    .toList());
        }
        if (r.experience() != null) {
            doc.setExperience(r.experience().stream()
                    .map(e -> new CvDocument.Experience(
                            e.company(), e.role(), e.startDate(), e.endDate(), e.description()))
                    .toList());
        }
        if (r.projects() != null) {
            doc.setProjects(r.projects().stream()
                    .map(p -> new CvDocument.Project(p.name(), p.description(), p.technologies()))
                    .toList());
        }
    }
}
