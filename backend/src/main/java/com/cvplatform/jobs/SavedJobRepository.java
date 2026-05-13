package com.cvplatform.jobs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, UUID> {

    Optional<SavedJob> findByUser_IdAndJob_Id(UUID userId, UUID jobId);

    boolean existsByUser_IdAndJob_Id(UUID userId, UUID jobId);

    @Query("SELECT s.job.id FROM SavedJob s WHERE s.user.id = :userId")
    List<UUID> findJobIdsByUser(@Param("userId") UUID userId);

    List<SavedJob> findAllByUser_IdOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Transactional
    void deleteByUser_IdAndJob_Id(UUID userId, UUID jobId);
}
