package com.cvplatform.jobs;

import com.cvplatform.analysis.AnalysisReport;
import com.cvplatform.analysis.AnalysisReportRepository;
import com.cvplatform.audit.AuditEventType;
import com.cvplatform.audit.AuditService;
import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.cv.CvDocument;
import com.cvplatform.cv.CvDocumentRepository;
import com.cvplatform.jobs.dto.ApplicationResponse;
import com.cvplatform.jobs.dto.ApplicationStatusUpdate;
import com.cvplatform.notifications.NotificationService;
import com.cvplatform.notifications.NotificationType;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobPostingRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final CvDocumentRepository cvRepository;
    private final AnalysisReportRepository analysisRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public List<ApplicationResponse> listForJob(User owner, UUID jobId) {
        JobPosting job = loadOwnedJob(owner, jobId);
        return applicationRepository.findAllByJob_IdOrderByAppliedAtDesc(job.getId()).stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    public Map<String, Object> getDetail(User owner, UUID applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("APPLICATION_NOT_FOUND", "Application not found"));
        Company company = ownedCompany(owner);
        if (!app.getJob().getCompany().getId().equals(company.getId())) {
            throw ApiException.forbidden("APPLICATION_NOT_OWNED",
                    "This application belongs to another company");
        }

        UUID userId = app.getUser().getId();
        CvDocument cv = cvRepository.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        AnalysisReport analysis = analysisRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .orElse(null);

        return Map.of(
                "application", ApplicationResponse.from(app),
                "cv", cv,
                "analysis", analysis
        );
    }

    @Transactional
    public ApplicationResponse updateStatus(User owner, UUID applicationId,
                                            ApplicationStatusUpdate req) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("APPLICATION_NOT_FOUND",
                        "Application not found"));
        Company company = ownedCompany(owner);
        if (!app.getJob().getCompany().getId().equals(company.getId())) {
            throw ApiException.forbidden("APPLICATION_NOT_OWNED",
                    "This application belongs to another company");
        }
        ApplicationStatus oldStatus = app.getStatus();
        app.setStatus(req.status());
        app = applicationRepository.save(app);

        // Notify the candidate of status change
        if (oldStatus != req.status()) {
            try {
                String tr = switch (req.status()) {
                    case NEW -> "Yeni";
                    case REVIEWING -> "İnceleniyor";
                    case INTERVIEW -> "Mülakata davet edildin";
                    case OFFERED -> "🎉 Teklif aldın";
                    case REJECTED -> "Maalesef başvurun reddedildi";
                };
                notificationService.notify(
                        app.getUser().getId(),
                        NotificationType.APPLICATION_STATUS,
                        "Başvuru durumu güncellendi · " + app.getJob().getTitle(),
                        tr + " — " + app.getJob().getCompany().getName(),
                        "/dashboard/applications"
                );
            } catch (Exception ignored) {}
            auditService.log(AuditEventType.APPLICATION_STATUS_CHANGED, owner,
                    "application", app.getId().toString(),
                    "Başvuru durumu " + oldStatus + " → " + req.status() + " (" + app.getJob().getTitle() + ")",
                    Map.of("from", oldStatus.name(), "to", req.status().name(),
                           "jobId", app.getJob().getId().toString()));
        }
        return ApplicationResponse.from(app);
    }

    private Company ownedCompany(User owner) {
        return companyRepository.findByOwner_Id(owner.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "No company associated with this account"));
    }

    private JobPosting loadOwnedJob(User owner, UUID jobId) {
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("JOB_NOT_FOUND", "Job not found"));
        Company company = ownedCompany(owner);
        if (!job.getCompany().getId().equals(company.getId())) {
            throw ApiException.forbidden("JOB_NOT_OWNED", "You do not own this job posting");
        }
        return job;
    }
}
