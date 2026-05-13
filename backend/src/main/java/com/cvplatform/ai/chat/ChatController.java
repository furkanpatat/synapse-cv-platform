package com.cvplatform.ai.chat;

import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/ai/chat")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatService.ChatMessage>> history(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getHistory(user));
    }

    @PostMapping
    public ResponseEntity<ChatService.ChatResponse> send(@AuthenticationPrincipal User user,
                                                         @RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "");
        return ResponseEntity.ok(chatService.send(user, message));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Boolean>> clear(@AuthenticationPrincipal User user) {
        chatService.clearHistory(user);
        return ResponseEntity.ok(Map.of("cleared", true));
    }
}
