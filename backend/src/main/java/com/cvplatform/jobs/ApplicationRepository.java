package com.cvplatform.jobs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findAllByJob_IdOrderByAppliedAtDesc(UUID jobId);
    List<Application> findAllByUser_IdOrderByAppliedAtDesc(UUID userId);
    Optional<Application> findByUser_IdAndJob_Id(UUID userId, UUID jobId);
    long countByJob_Id(UUID jobId);
}
