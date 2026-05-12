package com.cvplatform.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByUser_IdAndCompany_Id(UUID userId, UUID companyId);

    @Query("SELECT c FROM Conversation c WHERE c.user.id = :userId " +
            "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    List<Conversation> findAllByUser(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c WHERE c.company.id = :companyId " +
            "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    List<Conversation> findAllByCompany(@Param("companyId") UUID companyId);
}
