package com.cvplatform.interview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    Optional<InterviewSession> findByRoomToken(String roomToken);

    List<InterviewSession> findAllByApplication_User_IdOrderByScheduledAtDesc(UUID userId);

    List<InterviewSession> findAllByApplication_Job_Company_IdOrderByScheduledAtDesc(UUID companyId);
}
