package com.cvplatform.messaging;

import com.cvplatform.messaging.dto.ConversationDto;
import com.cvplatform.messaging.dto.MessageDto;
import com.cvplatform.messaging.dto.SendMessageRequest;
import com.cvplatform.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/conversations")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService service;

    @GetMapping
    public ResponseEntity<List<ConversationDto>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.listMyConversations(user));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageDto>> messages(@AuthenticationPrincipal User user,
                                                     @PathVariable UUID id) {
        return ResponseEntity.ok(service.getMessages(user, id));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, Integer>> markRead(@AuthenticationPrincipal User user,
                                                         @PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("updated", service.markRead(user, id)));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageDto> send(@AuthenticationPrincipal User user,
                                           @Valid @RequestBody SendMessageRequest req) {
        return ResponseEntity.ok(service.sendMessage(user, req));
    }
}
