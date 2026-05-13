package com.cvplatform.mockinterview;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MockInterviewRepository extends JpaRepository<MockInterview, UUID> {
    List<MockInterview> findAllByUser_IdOrderByCreatedAtDesc(UUID userId);
}
