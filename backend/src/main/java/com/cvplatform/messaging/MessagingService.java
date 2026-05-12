package com.cvplatform.messaging;

import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.messaging.dto.ConversationDto;
import com.cvplatform.messaging.dto.MessageDto;
import com.cvplatform.messaging.dto.SendMessageRequest;
import com.cvplatform.notifications.NotificationService;
import com.cvplatform.notifications.NotificationType;
import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    public List<ConversationDto> listMyConversations(User caller) {
        List<Conversation> convs = (caller.getRole() == Role.COMPANY)
                ? companyConversations(caller)
                : conversationRepository.findAllByUser(caller.getId());

        return convs.stream()
                .map(c -> ConversationDto.from(c, unreadFor(caller, c)))
                .toList();
    }

    public List<MessageDto> getMessages(User caller, UUID conversationId) {
        Conversation conv = loadAndAuthorize(caller, conversationId);
        return messageRepository.findAllByConversation_IdOrderByCreatedAtAsc(conv.getId()).stream()
                .map(MessageDto::from)
                .toList();
    }

    @Transactional
    public int markRead(User caller, UUID conversationId) {
        Conversation conv = loadAndAuthorize(caller, conversationId);
        return messageRepository.markAllAsRead(conv.getId(), caller.getId(), Instant.now());
    }

    @Transactional
    public MessageDto sendMessage(User sender, SendMessageRequest req) {
        Conversation conv = req.conversationId() != null
                ? loadAndAuthorize(sender, req.conversationId())
                : findOrCreateConversation(sender, req);

        Message msg = Message.builder()
                .conversation(conv)
                .sender(sender)
                .body(req.body())
                .build();
        msg = messageRepository.save(msg);
        conv.setLastMessageAt(msg.getCreatedAt());
        conversationRepository.save(conv);

        MessageDto dto = MessageDto.from(msg);
        notifyParticipants(conv, dto);
        return dto;
    }

    /**
     * Find an existing conversation between (user, company) or create a new one.
     * The sender role determines which side we already know.
     */
    private Conversation findOrCreateConversation(User sender, SendMessageRequest req) {
        UUID userId;
        UUID companyId;
        if (sender.getRole() == Role.COMPANY) {
            Company company = companyRepository.findByOwner_Id(sender.getId())
                    .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                            "No company associated with this account"));
            if (req.toUserId() == null) {
                throw ApiException.badRequest("MISSING_RECIPIENT", "toUserId is required");
            }
            User other = userRepository.findById(req.toUserId())
                    .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "Recipient user not found"));
            userId = other.getId();
            companyId = company.getId();
        } else {
            if (req.toCompanyId() == null) {
                throw ApiException.badRequest("MISSING_RECIPIENT", "toCompanyId is required");
            }
            Company company = companyRepository.findById(req.toCompanyId())
                    .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND", "Company not found"));
            userId = sender.getId();
            companyId = company.getId();
        }

        return conversationRepository.findByUser_IdAndCompany_Id(userId, companyId)
                .orElseGet(() -> {
                    User u = userRepository.findById(userId).orElseThrow();
                    Company c = companyRepository.findById(companyId).orElseThrow();
                    return conversationRepository.save(
                            Conversation.builder().user(u).company(c).build());
                });
    }

    private Conversation loadAndAuthorize(User caller, UUID conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> ApiException.notFound("CONV_NOT_FOUND", "Conversation not found"));
        boolean isParticipant;
        if (caller.getRole() == Role.COMPANY) {
            Company company = companyRepository.findByOwner_Id(caller.getId()).orElse(null);
            isParticipant = company != null && conv.getCompany().getId().equals(company.getId());
        } else {
            isParticipant = conv.getUser().getId().equals(caller.getId());
        }
        if (!isParticipant) {
            throw ApiException.forbidden("CONV_NOT_PARTICIPANT", "Not a participant in this conversation");
        }
        return conv;
    }

    private List<Conversation> companyConversations(User owner) {
        Company company = companyRepository.findByOwner_Id(owner.getId())
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND",
                        "No company associated with this account"));
        return conversationRepository.findAllByCompany(company.getId());
    }

    private long unreadFor(User caller, Conversation conv) {
        return messageRepository.countByConversation_IdAndSender_IdNotAndReadAtIsNull(
                conv.getId(), caller.getId());
    }

    private void notifyParticipants(Conversation conv, MessageDto dto) {
        // Push the live message to both sides
        UUID userId = conv.getUser().getId();
        UUID companyOwnerId;
        try {
            companyOwnerId = conv.getCompany().getOwner().getId();
        } catch (Exception ex) {
            companyOwnerId = null;
        }
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/messages", dto);
        if (companyOwnerId != null) {
            messagingTemplate.convertAndSendToUser(companyOwnerId.toString(), "/queue/messages", dto);
        }

        // Persist a notification for the other participant
        try {
            UUID recipientId =
                    dto.senderId().equals(userId) ? companyOwnerId : userId;
            if (recipientId != null) {
                String otherSideLink =
                        dto.senderId().equals(userId) ? "/company/messages" : "/dashboard/messages";
                String preview = dto.body() == null ? ""
                        : dto.body().length() > 80
                            ? dto.body().substring(0, 80) + "..."
                            : dto.body();
                notificationService.notify(
                        recipientId,
                        NotificationType.NEW_MESSAGE,
                        "Yeni mesaj · " + dto.senderName(),
                        preview,
                        otherSideLink
                );
            }
        } catch (Exception ex) {
            log.warn("Failed to persist notification for message: {}", ex.getMessage());
        }
    }
}
