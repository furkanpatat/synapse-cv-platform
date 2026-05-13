package com.cvplatform.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findTop50ByActorIdOrderByCreatedAtDesc(UUID actorId);

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
            SELECT a FROM AuditLog a
             WHERE (:eventType IS NULL OR a.eventType = :eventType)
               AND (:actorId IS NULL OR a.actorId = :actorId)
               AND (:since IS NULL OR a.createdAt >= :since)
             ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> search(@Param("eventType") String eventType,
                          @Param("actorId") UUID actorId,
                          @Param("since") Instant since,
                          Pageable pageable);
}
