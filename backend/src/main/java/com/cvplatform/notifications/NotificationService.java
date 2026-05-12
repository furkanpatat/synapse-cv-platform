package com.cvplatform.notifications;

import com.cvplatform.notifications.dto.NotificationDto;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /** Fire-and-forget notification creator with WS push. */
    @Transactional
    public void notify(UUID userId, NotificationType type, String title, String body, String link) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;
            Notification n = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .body(body)
                    .link(link)
                    .build();
            n = repository.save(n);
            try {
                messagingTemplate.convertAndSendToUser(
                        userId.toString(), "/queue/notifications", NotificationDto.from(n));
            } catch (Exception wsEx) {
                log.warn("WS notification push failed for {}: {}", userId, wsEx.getMessage());
            }
        } catch (Exception ex) {
            log.warn("Notification create failed: {}", ex.getMessage());
        }
    }

    public NotificationFeed list(UUID userId, int page, int size) {
        Page<Notification> p = repository.findAllByUser_IdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        long unread = repository.countByUser_IdAndReadAtIsNull(userId);
        return new NotificationFeed(
                p.getContent().stream().map(NotificationDto::from).toList(),
                unread,
                p.getTotalElements()
        );
    }

    @Transactional
    public int markRead(UUID userId, UUID id) {
        return repository.markRead(id, userId, Instant.now());
    }

    @Transactional
    public int markAllRead(UUID userId) {
        return repository.markAllRead(userId, Instant.now());
    }

    public record NotificationFeed(List<NotificationDto> items, long unread, long total) {}
}
