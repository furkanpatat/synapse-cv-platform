package com.cvplatform.common;

import com.cvplatform.subscription.SubscriptionLimits;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Lightweight per-user-per-hour token bucket backed by Redis INCR + EXPIRE.
 * Used to keep AI Gemini cost predictable.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitService {

    private static final DateTimeFormatter HOUR_KEY =
            DateTimeFormatter.ofPattern("yyyyMMddHH").withZone(ZoneOffset.UTC);

    private final StringRedisTemplate redis;

    /** AI calls per hour by plan. */
    private int hourlyAiLimit(SubscriptionType plan) {
        if (SubscriptionLimits.isPremium(plan)) return 100;
        return 10;
    }

    /**
     * Increments the counter and throws 429 if the user exceeded the AI hourly
     * limit. Each call costs 1 unit.
     */
    public void chargeAi(User user) {
        String hour = HOUR_KEY.format(Instant.now());
        String key = "ratelimit:ai:" + user.getId() + ":" + hour;

        Long count;
        try {
            count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, Duration.ofHours(1));
            }
        } catch (Exception ex) {
            // Redis down → fail open (don't block users on infra issues)
            log.warn("RateLimit redis unavailable, allowing call: {}", ex.getMessage());
            return;
        }

        int limit = hourlyAiLimit(user.getSubscriptionType());
        if (count != null && count > limit) {
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "RATE_LIMITED",
                    "Saatlik AI kotanı aştın (" + limit
                            + "/saat). Lütfen biraz sonra tekrar dene veya PREMIUM'a yükselt."
            );
        }
    }
}
