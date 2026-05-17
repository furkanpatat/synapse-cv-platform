package com.cvplatform.cv;

import com.cvplatform.common.ApiException;
import com.cvplatform.cv.dto.CvUpdateRequest;
import com.cvplatform.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The two interesting paths in CvService that don't need real I/O:
 *
 *   - createOrReplaceManual() must UPSERT — work when the user has no CV
 *     yet, and replace in place when they do.
 *   - rebuildRawText() must keep the AI pipeline working on builder-mode
 *     CVs. The downstream verifier reads `rawText`, so if a builder save
 *     leaves rawText empty, the whole analysis chain silently breaks.
 *     We verify the section headers and sample bullets land in the
 *     reconstructed string.
 */
class CvServiceTest {

    private CvDocumentRepository repo;
    private StorageService storage;
    private AiServiceClient aiService;
    private CvService service;

    private UUID userId;

    @BeforeEach
    void setUp() {
        repo = mock(CvDocumentRepository.class);
        storage = mock(StorageService.class);
        aiService = mock(AiServiceClient.class);
        // Echo back whatever we save so the test can inspect the entity.
        when(repo.save(any(CvDocument.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        service = new CvService(storage, repo, aiService);
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createOrReplaceManual() creates a fresh CV when the user has none")
    void createOrReplaceManual_freshUser() {
        when(repo.findFirstByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Optional.empty());

        CvDocument saved = service.createOrReplaceManual(userId, sampleRequest());

        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getStatus()).isEqualTo(CvDocument.CvStatus.PARSED);
        assertThat(saved.getOriginalFilename()).isEqualTo("manual-cv.txt");
        // No source file for builder-mode CVs.
        assertThat(saved.getFileObjectName()).isNull();
        assertThat(saved.getPersonal().getName()).isEqualTo("Ayşe Yılmaz");
        verify(repo).save(any(CvDocument.class));
    }

    @Test
    @DisplayName("createOrReplaceManual() overwrites the existing CV in place")
    void createOrReplaceManual_existingUser() {
        CvDocument existing = CvDocument.builder()
                .id("old-id")
                .userId(userId)
                .status(CvDocument.CvStatus.PARSED)
                .originalFilename("old.pdf")
                .fileObjectName("cvs/old.pdf")
                .summary("eski özet")
                .build();
        when(repo.findFirstByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.of(existing));

        CvDocument saved = service.createOrReplaceManual(userId, sampleRequest());

        // Same Mongo doc — replaced, not duplicated.
        assertThat(saved.getId()).isEqualTo("old-id");
        // Source file pointer cleared (the builder doesn't own a file).
        assertThat(saved.getFileObjectName()).isNull();
        // Fields replaced with the new payload.
        assertThat(saved.getSummary()).isEqualTo("React + TS frontend developer.");
        assertThat(saved.getSkills()).contains("React", "TypeScript");
    }

    @Test
    @DisplayName("rebuildRawText() concatenates sections in the verifier-friendly format")
    void rebuildRawText_concatenatesSections() {
        when(repo.findFirstByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Optional.empty());

        CvDocument saved = service.createOrReplaceManual(userId, sampleRequest());
        String raw = saved.getRawText();

        // Header (name + contact)
        assertThat(raw).contains("Ayşe Yılmaz");
        assertThat(raw).contains("ayse@example.com");
        // Section headers in Turkish caps
        assertThat(raw)
                .contains("ÖZET")
                .contains("YETKİNLİKLER")
                .contains("DENEYİM")
                .contains("EĞİTİM")
                .contains("PROJELER")
                .contains("DİLLER");
        // Sample content from each section
        assertThat(raw).contains("React + TS frontend developer.");
        assertThat(raw).contains("React, TypeScript, Node.js");
        assertThat(raw).contains("Frontend Developer");
        assertThat(raw).contains("TechNova");
        assertThat(raw).contains("Synapse");
    }

    @Test
    @DisplayName("updateMyCv() still works on uploaded CVs (existing flow not regressed)")
    void updateMyCv_existingFlow() {
        CvDocument existing = CvDocument.builder()
                .id("doc-1")
                .userId(userId)
                .status(CvDocument.CvStatus.PARSED)
                .summary("old")
                .build();
        when(repo.findFirstByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.of(existing));

        CvDocument saved = service.updateMyCv(userId, new CvUpdateRequest(
                null, "yeni özet", List.of("Go"), null, null, null, null));

        assertThat(saved.getSummary()).isEqualTo("yeni özet");
        assertThat(saved.getSkills()).containsExactly("Go");
        // rebuildRawText fires here too, so raw text reflects new summary.
        assertThat(saved.getRawText()).contains("yeni özet");
    }

    @Test
    @DisplayName("updateMyCv() on a user with no CV throws CV_NOT_FOUND (unchanged contract)")
    void updateMyCv_noCv_404() {
        when(repo.findFirstByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.updateMyCv(userId, sampleRequest()))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("getDownloadUrl() returns null when no source file (builder CVs)")
    void getDownloadUrl_noFile() {
        CvDocument doc = CvDocument.builder()
                .id("x").userId(userId)
                .fileObjectName(null)
                .build();

        assertThat(service.getDownloadUrl(doc)).isNull();
    }

    @Test
    @DisplayName("getDownloadUrl() proxies to StorageService for uploaded CVs")
    void getDownloadUrl_uploaded() {
        CvDocument doc = CvDocument.builder()
                .id("x").userId(userId)
                .fileObjectName("cvs/ayse.pdf")
                .build();
        when(storage.presignedDownloadUrl(eq("cvs/ayse.pdf"), eq(3600)))
                .thenReturn("https://minio/cvs/ayse.pdf?sig=...");

        String url = service.getDownloadUrl(doc);

        assertThat(url).startsWith("https://minio/");
    }

    // ----- helpers -----

    private CvUpdateRequest sampleRequest() {
        return new CvUpdateRequest(
                CvDocument.Personal.builder()
                        .name("Ayşe Yılmaz")
                        .email("ayse@example.com")
                        .phone("+90 555")
                        .location("İstanbul")
                        .build(),
                "React + TS frontend developer.",
                List.of("React", "TypeScript", "Node.js"),
                List.of(CvDocument.Education.builder()
                        .school("SDÜ").degree("Lisans").field("Bilgisayar")
                        .startYear("2020").endYear("2024").build()),
                List.of(CvDocument.Experience.builder()
                        .company("TechNova").role("Frontend Developer")
                        .startDate("2022-03").endDate("2024-09")
                        .description("React/TS ekibinde 3 yıl çalıştım.")
                        .build()),
                List.of(CvDocument.Project.builder()
                        .name("Synapse").description("AI CV platform")
                        .technologies(List.of("Next.js", "Spring Boot"))
                        .build()),
                List.of("Türkçe (anadil)", "İngilizce (C1)")
        );
    }
}
