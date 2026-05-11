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
        if (req.personal() != null) doc.setPersonal(req.personal());
        if (req.summary() != null) doc.setSummary(req.summary());
        if (req.skills() != null) doc.setSkills(req.skills());
        if (req.education() != null) doc.setEducation(req.education());
        if (req.experience() != null) doc.setExperience(req.experience());
        if (req.projects() != null) doc.setProjects(req.projects());
        if (req.languages() != null) doc.setLanguages(req.languages());
        return cvRepository.save(doc);
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
