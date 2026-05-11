package com.cvplatform.jobs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, UUID> {
    List<JobPosting> findAllByCompany_IdOrderByCreatedAtDesc(UUID companyId);
    Page<JobPosting> findAllByStatus(JobStatus status, Pageable pageable);
}
