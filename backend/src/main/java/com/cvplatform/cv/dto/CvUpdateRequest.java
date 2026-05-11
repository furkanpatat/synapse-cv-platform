package com.cvplatform.cv.dto;

import com.cvplatform.cv.CvDocument;

import java.util.List;

public record CvUpdateRequest(
        CvDocument.Personal personal,
        String summary,
        List<String> skills,
        List<CvDocument.Education> education,
        List<CvDocument.Experience> experience,
        List<CvDocument.Project> projects,
        List<String> languages
) {}
