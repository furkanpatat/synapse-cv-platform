package com.cvplatform.interview;

import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.jobs.Application;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.ApplicationStatus;
import com.cvplatform.notifications.NotificationService;
import com.cvplatform.notifications.NotificationType;
import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class InterviewService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final InterviewSessionRepository repository;
    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;

    @Transactional
    public InterviewSession schedule(User companyOwner,
                                     UUID applicationId,
                                     Instant scheduledAt,
                                     Integer durationMin) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("APPLICATION_NOT_FOUND", "Application not found"));

        // Ownership check
        Company company = companyRepository.findByOwner_Id(companyOwner.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "No company associated with this account"));
        if (!app.getJob().getCompany().getId().equals(company.getId())) {
            throw ApiException.forbidden("APPLICATION_NOT_OWNED",
                    "This application belongs to another company");
        }
        if (scheduledAt == null || scheduledAt.isBefore(Instant.now().minusSeconds(60))) {
            throw ApiException.badRequest("INVALID_DATE", "Scheduled date must be in the future");
        }

        InterviewSession session = InterviewSession.builder()
                .application(app)
                .scheduledAt(scheduledAt)
                .durationMin(durationMin == null ? 45 : durationMin)
                .roomToken(randomToken())
                .status(InterviewSession.Status.SCHEDULED)
                .build();
        session = repository.save(session);

        // Flip application status to INTERVIEW if not already past it
        if (app.getStatus() == ApplicationStatus.NEW || app.getStatus() == ApplicationStatus.REVIEWING) {
            app.setStatus(ApplicationStatus.INTERVIEW);
            applicationRepository.save(app);
        }

        // Notify candidate
        try {
            notificationService.notify(
                    app.getUser().getId(),
                    NotificationType.APPLICATION_STATUS,
                    "🎥 Mülakata davet edildin",
                    company.getName() + " seninle " + scheduledAt + " tarihinde görüşmek istiyor.",
                    "/dashboard/interviews"
            );
        } catch (Exception ignored) {}

        return session;
    }

    public InterviewSession getByToken(String token) {
        return repository.findByRoomToken(token)
                .orElseThrow(() -> ApiException.notFound("INTERVIEW_NOT_FOUND",
                        "Interview session not found"));
    }

    public List<InterviewSession> listMine(User user) {
        if (user.getRole() == Role.COMPANY) {
            Company company = companyRepository.findByOwner_Id(user.getId())
                    .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                            "No company associated with this account"));
            return repository.findAllByApplication_Job_Company_IdOrderByScheduledAtDesc(company.getId());
        }
        return repository.findAllByApplication_User_IdOrderByScheduledAtDesc(user.getId());
    }

    @Transactional
    public InterviewSession markStarted(String token, User caller) {
        InterviewSession s = authorizeRoomAccess(token, caller);
        if (s.getStatus() == InterviewSession.Status.SCHEDULED) {
            s.setStatus(InterviewSession.Status.STARTED);
            s.setStartedAt(Instant.now());
            repository.save(s);
        }
        return s;
    }

    @Transactional
    public InterviewSession markEnded(String token, User caller) {
        InterviewSession s = authorizeRoomAccess(token, caller);
        if (s.getStatus() != InterviewSession.Status.ENDED) {
            s.setStatus(InterviewSession.Status.ENDED);
            s.setEndedAt(Instant.now());
            repository.save(s);
        }
        return s;
    }

    public InterviewSession authorizeRoomAccess(String token, User caller) {
        InterviewSession s = getByToken(token);
        boolean isCandidate = s.getApplication().getUser().getId().equals(caller.getId());
        boolean isCompanyOwner = false;
        if (!isCandidate) {
            Company company = companyRepository.findByOwner_Id(caller.getId()).orElse(null);
            isCompanyOwner = company != null
                    && s.getApplication().getJob().getCompany().getId().equals(company.getId());
        }
        if (!isCandidate && !isCompanyOwner) {
            throw ApiException.forbidden("INTERVIEW_NOT_PARTICIPANT",
                    "You are not a participant in this interview");
        }
        return s;
    }

    private static String randomToken() {
        byte[] b = new byte[18];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
