package com.cvplatform.cv;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CvDocumentRepository extends MongoRepository<CvDocument, String> {
    Optional<CvDocument> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}
