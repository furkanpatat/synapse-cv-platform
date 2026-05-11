package com.cvplatform.cv.dto;

import com.cvplatform.cv.CvDocument;

import java.time.Instant;
import java.util.List;

public record CvResponse(
        String id,
        String originalFilename,
        String fileDownloadUrl,
        CvDocument.CvStatus status,
        String errorMessage,
        CvDocument.Personal personal,
        String summary,
        List<String> skills,
        List<CvDocument.Education> education,
        List<CvDocument.Experience> experience,
        List<CvDocument.Project> projects,
        List<String> languages,
        Instant updatedAt
) {
    public static CvResponse from(CvDocument doc, String downloadUrl) {
        return new CvResponse(
                doc.getId(),
                doc.getOriginalFilename(),
                downloadUrl,
                doc.getStatus(),
                doc.getErrorMessage(),
                doc.getPersonal(),
                doc.getSummary(),
                doc.getSkills(),
                doc.getEducation(),
                doc.getExperience(),
                doc.getProjects(),
                doc.getLanguages(),
                doc.getUpdatedAt()
        );
    }
}
