package com.cvplatform.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findAllByConversation_IdOrderByCreatedAtAsc(UUID conversationId);

    long countByConversation_IdAndSender_IdNotAndReadAtIsNull(UUID conversationId, UUID senderId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.readAt = :now " +
            "WHERE m.conversation.id = :convId AND m.sender.id <> :viewerId AND m.readAt IS NULL")
    int markAllAsRead(@Param("convId") UUID convId,
                      @Param("viewerId") UUID viewerId,
                      @Param("now") Instant now);
}
