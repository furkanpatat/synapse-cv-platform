package com.cvplatform.jobs;

import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.jobs.dto.JobRequest;
import com.cvplatform.jobs.dto.JobResponse;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyJobService {

    private final JobPostingRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationRepository applicationRepository;

    public List<JobResponse> listMyJobs(User owner) {
        Company company = ownedCompany(owner);
        return jobRepository.findAllByCompany_IdOrderByCreatedAtDesc(company.getId()).stream()
                .map(j -> JobResponse.from(j, applicationRepository.countByJob_Id(j.getId())))
                .toList();
    }

    @Transactional
    public JobResponse create(User owner, JobRequest req) {
        Company company = ownedCompany(owner);
        JobStatus requested = req.status() != null ? req.status() : JobStatus.DRAFT;
        if (requested == JobStatus.ACTIVE && !company.isVerified()) {
            throw ApiException.forbidden("COMPANY_NOT_VERIFIED",
                    "Your company must be verified by an admin before publishing jobs");
        }
        JobPosting job = JobPosting.builder()
                .company(company)
                .title(req.title())
                .description(req.description())
                .city(req.city())
                .remoteType(req.remoteType() != null ? req.remoteType() : RemoteType.ONSITE)
                .level(req.level() != null ? req.level() : JobLevel.MID)
                .salaryMin(req.salaryMin())
                .salaryMax(req.salaryMax())
                .currency(req.currency() != null ? req.currency() : "TRY")
                .requiredSkills(req.requiredSkills() != null ? req.requiredSkills() : List.of())
                .status(requested)
                .build();
        job = jobRepository.save(job);
        return JobResponse.from(job, 0L);
    }

    public JobResponse get(User owner, UUID jobId) {
        JobPosting job = loadOwned(owner, jobId);
        return JobResponse.from(job, applicationRepository.countByJob_Id(jobId));
    }

    @Transactional
    public JobResponse update(User owner, UUID jobId, JobRequest req) {
        JobPosting job = loadOwned(owner, jobId);
        if (req.status() == JobStatus.ACTIVE && !job.getCompany().isVerified()) {
            throw ApiException.forbidden("COMPANY_NOT_VERIFIED",
                    "Your company must be verified by an admin before publishing jobs");
        }
        if (req.title() != null) job.setTitle(req.title());
        if (req.description() != null) job.setDescription(req.description());
        if (req.city() != null) job.setCity(req.city());
        if (req.remoteType() != null) job.setRemoteType(req.remoteType());
        if (req.level() != null) job.setLevel(req.level());
        if (req.salaryMin() != null) job.setSalaryMin(req.salaryMin());
        if (req.salaryMax() != null) job.setSalaryMax(req.salaryMax());
        if (req.currency() != null) job.setCurrency(req.currency());
        if (req.requiredSkills() != null) job.setRequiredSkills(req.requiredSkills());
        if (req.status() != null) job.setStatus(req.status());
        job = jobRepository.save(job);
        return JobResponse.from(job, applicationRepository.countByJob_Id(jobId));
    }

    @Transactional
    public void delete(User owner, UUID jobId) {
        JobPosting job = loadOwned(owner, jobId);
        jobRepository.delete(job);
    }

    private Company ownedCompany(User owner) {
        return companyRepository.findByOwner_Id(owner.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "No company associated with this account"));
    }

    private JobPosting loadOwned(User owner, UUID jobId) {
        JobPosting job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("JOB_NOT_FOUND", "Job not found"));
        Company company = ownedCompany(owner);
        if (!job.getCompany().getId().equals(company.getId())) {
            throw ApiException.forbidden("JOB_NOT_OWNED", "You do not own this job posting");
        }
        return job;
    }
}
