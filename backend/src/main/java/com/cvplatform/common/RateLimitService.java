package com.cvplatform.common;

import com.cvplatform.subscription.SubscriptionLimits;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Three layered Redis-backed counters that protect the AI endpoints:
 *
 *   1. PER-IP per minute    — first line of defence against scripted abuse
 *                              from a single host.
 *   2. PER-USER per hour    — predictable Gemini cost ceiling per plan
 *                              (FREE = 10/h, PREMIUM = 100/h).
 *   3. GLOBAL daily budget  — circuit breaker so a viral spike on the
 *                              platform can't blow our monthly Gemini bill.
 *
 * Each layer is an INCR + EXPIRE pair on a distinct bucket key. Redis
 * being down fails OPEN (we log a warning and let the request through)
 * because a rate-limiter outage shouldn't take down user-facing AI.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitService {

    private static final DateTimeFormatter HOUR_KEY =
            DateTimeFormatter.ofPattern("yyyyMMddHH").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter MINUTE_KEY =
            DateTimeFormatter.ofPattern("yyyyMMddHHmm").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter DAY_KEY =
            DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC);

    private final StringRedisTemplate redis;

    @Value("${app.ratelimit.ai.per-ip-per-minute:30}")
    private int perIpPerMinute;

    /**
     * Per-day global Gemini call ceiling. Once we cross this, every AI
     * endpoint returns 429 across the board until the next UTC midnight.
     * Default is ~5k calls; tune via env to your Gemini budget.
     */
    @Value("${app.ratelimit.ai.global-daily-budget:5000}")
    private int globalDailyBudget;

    /** AI calls per hour by plan. */
    private int hourlyAiLimit(SubscriptionType plan) {
        if (SubscriptionLimits.isPremium(plan)) return 100;
        return 10;
    }

    /**
     * Charge all three layers for a single AI call. Throws 429 on the first
     * exhausted layer; layers are checked in cheap-to-expensive order so an
     * IP flood is rejected before we even look up the user's plan.
     *
     * @param user    authenticated user issuing the request
     * @param request HTTP request — used to extract the client IP. Pass
     *                {@code null} when called from a non-HTTP context (worker,
     *                test) and the IP layer is skipped.
     */
    public void chargeAi(User user, HttpServletRequest request) {
        Instant now = Instant.now();

        // ── Layer 1: per-IP per minute ────────────────────────────
        String ip = clientIp(request);
        if (ip != null) {
            String ipKey = "ratelimit:ai:ip:" + ip + ":" + MINUTE_KEY.format(now);
            Long ipCount = increment(ipKey, Duration.ofMinutes(2));
            if (ipCount != null && ipCount > perIpPerMinute) {
                log.warn("AI rate limit IP hit: ip={} count={}", ip, ipCount);
                throw new ApiException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "RATE_LIMITED_IP",
                        "Bu IP'den çok fazla istek geldi (" + perIpPerMinute
                                + "/dk). Lütfen biraz sonra tekrar dene.");
            }
        }

        // ── Layer 2: per-user per hour (plan-aware) ───────────────
        String userKey = "ratelimit:ai:user:" + user.getId() + ":" + HOUR_KEY.format(now);
        Long userCount = increment(userKey, Duration.ofHours(1).plusMinutes(5));
        int limit = hourlyAiLimit(user.getSubscriptionType());
        if (userCount != null && userCount > limit) {
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "RATE_LIMITED",
                    "Saatlik AI kotanı aştın (" + limit
                            + "/saat). Lütfen biraz sonra tekrar dene veya PREMIUM'a yükselt.");
        }

        // ── Layer 3: global daily Gemini budget ───────────────────
        String globalKey = "ratelimit:ai:global:" + DAY_KEY.format(now);
        Long globalCount = increment(globalKey, Duration.ofHours(25));
        if (globalCount != null && globalCount > globalDailyBudget) {
            log.error("AI global daily budget exhausted: count={} limit={}",
                    globalCount, globalDailyBudget);
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "AI_BUDGET_EXHAUSTED",
                    "Bugünkü AI bütçesi tamamen kullanıldı. Yarın UTC 00:00'da yenilenecek.");
        }
    }

    /** Backwards-compat overload — older callers without a request context. */
    public void chargeAi(User user) {
        chargeAi(user, null);
    }

    /**
     * Read-only snapshot of how many AI calls the platform has made today
     * globally. Exposed so admin / Prometheus can graph the daily budget
     * consumption without re-incrementing.
     */
    public long globalAiUsageToday() {
        try {
            String key = "ratelimit:ai:global:" + DAY_KEY.format(Instant.now());
            String v = redis.opsForValue().get(key);
            return v == null ? 0L : Long.parseLong(v);
        } catch (Exception ex) {
            return -1L;
        }
    }

    public int globalDailyBudget() {
        return globalDailyBudget;
    }

    // ============ internals ============

    /** Increment + best-effort TTL set; null = redis unavailable, fail open. */
    private Long increment(String key, Duration ttl) {
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, ttl);
            }
            return count;
        } catch (Exception ex) {
            log.warn("RateLimit redis unavailable on key {}: {}", key, ex.getMessage());
            return null;
        }
    }

    /** Best-effort client IP; honours X-Forwarded-For first hop. */
    private static String clientIp(HttpServletRequest req) {
        if (req == null) return null;
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String real = req.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        return req.getRemoteAddr();
    }
}
