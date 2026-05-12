package com.cvplatform.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByUser_IdAndCompany_Id(UUID userId, UUID companyId);

    List<Conversation> findAllByUser_IdOrderByLastMessageAtDescNullsLast(UUID userId);
    List<Conversation> findAllByCompany_IdOrderByLastMessageAtDescNullsLast(UUID companyId);
}
