package com.cvplatform.interview;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * Relay-only signaling for the WebRTC peer connection. Clients send offers,
 * answers, and ICE candidates here, and they are broadcast to anyone
 * subscribed to /topic/interview/{token}. We do not interpret the payload.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class SignalingController {

    @MessageMapping("/interview/{token}/signal")
    @SendTo("/topic/interview/{token}")
    public Map<String, Object> relay(@DestinationVariable String token,
                                     @Payload Map<String, Object> message) {
        log.debug("Relay signal on token={} type={}", token, message.get("type"));
        return message;
    }
}
