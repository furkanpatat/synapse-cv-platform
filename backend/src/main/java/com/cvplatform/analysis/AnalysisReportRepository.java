package com.cvplatform.analysis;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnalysisReportRepository extends MongoRepository<AnalysisReport, String> {
    Optional<AnalysisReport> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}
