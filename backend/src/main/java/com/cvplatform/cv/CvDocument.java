package com.cvplatform.cv;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Document(collection = "cv_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvDocument {

    @Id
    private String id;

    @Indexed
    private UUID userId;

    private String originalFilename;
    private String fileObjectName;   // MinIO object key
    private String rawText;
    private CvStatus status;
    private String errorMessage;

    private Personal personal;
    private String summary;
    private List<String> skills;
    private List<Education> education;
    private List<Experience> experience;
    private List<Project> projects;
    private List<String> languages;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public enum CvStatus { PENDING, PARSED, FAILED }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Personal {
        private String name;
        private String email;
        private String phone;
        private String location;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Education {
        private String school;
        private String degree;
        private String field;
        private String startYear;
        private String endYear;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Experience {
        private String company;
        private String role;
        private String startDate;
        private String endDate;
        private String description;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Project {
        private String name;
        private String description;
        private List<String> technologies;
    }
}
