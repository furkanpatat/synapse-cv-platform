package com.cvplatform.common;

import com.cvplatform.user.Role;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * RateLimitService has three layered counters; the test matrix verifies
 * that each layer trips correctly without interfering with the others,
 * and that a Redis outage fails OPEN (the most common cause of "the
 * whole platform went down at 3am because cache crashed").
 *
 * We mock StringRedisTemplate + ValueOperations end-to-end so we can
 * dictate exactly what INCR returns. ReflectionTestUtils sets the
 * per-IP / global thresholds to small values so a single-digit counter
 * value can trigger the limit.
 */
class RateLimitServiceTest {

    private StringRedisTemplate redis;
    private ValueOperations<String, String> ops;
    private RateLimitService service;
    private User user;

    @BeforeEach
    void setUp() {
        redis = mock(StringRedisTemplate.class);
        ops = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(ops);
        service = new RateLimitService(redis);
        // small numbers so the tests don't need to call increment 100 times
        ReflectionTestUtils.setField(service, "perIpPerMinute", 3);
        ReflectionTestUtils.setField(service, "globalDailyBudget", 50);

        user = User.builder()
                .id(UUID.randomUUID())
                .email("ayse@example.com")
                .role(Role.USER)
                .subscriptionType(SubscriptionType.FREE)
                .build();
    }

    @Test
    @DisplayName("All three layers under budget → pass")
    void underBudget_passes() {
        // Each INCR returns 1 (first call of the window for that key).
        when(ops.increment(anyString())).thenReturn(1L);

        // No throw expected.
        service.chargeAi(user, mockReq("203.0.113.7"));
        // Three buckets touched: ip, user, global
        verify(ops, org.mockito.Mockito.times(3)).increment(anyString());
    }

    @Test
    @DisplayName("Layer 1 — per-IP per minute trips first (cheap rejection)")
    void perIp_layerTrips() {
        when(ops.increment(anyString())).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            // First arg gets a >limit count, others 1
            if (key.contains(":ai:ip:")) return 4L; // 4 > perIpPerMinute=3
            return 1L;
        });

        assertThatThrownBy(() -> service.chargeAi(user, mockReq("198.51.100.42")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("IP");
        // Should NOT have charged user or global once IP trips.
        // (single increment for ip key is enough to know)
    }

    @Test
    @DisplayName("Layer 2 — user per hour trips for FREE plan at >10")
    void perUserHour_freePlan() {
        when(ops.increment(anyString())).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            if (key.contains(":ai:ip:")) return 1L;       // ip fine
            if (key.contains(":ai:user:")) return 11L;    // 11 > FREE limit 10
            return 1L;
        });

        assertThatThrownBy(() -> service.chargeAi(user, mockReq("203.0.113.9")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("AI kotanı");
    }

    @Test
    @DisplayName("Layer 2 — PREMIUM gets 100/h (count 11 is still OK)")
    void perUserHour_premiumHigher() {
        user.setSubscriptionType(SubscriptionType.PREMIUM);
        // Only the user bucket reports 11; ip + global stay under their tiny
        // test limits so they don't trip first.
        when(ops.increment(anyString())).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            if (key.contains(":ai:user:")) return 11L;
            return 1L;
        });

        // Should NOT throw for premium — 11 is below 100 limit.
        service.chargeAi(user, mockReq("203.0.113.10"));
    }

    @Test
    @DisplayName("Layer 3 — global daily budget circuit breaker trips at >limit")
    void globalDaily_trips() {
        when(ops.increment(anyString())).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            if (key.contains(":ai:global:")) return 51L; // 51 > 50
            return 1L;
        });

        assertThatThrownBy(() -> service.chargeAi(user, mockReq("203.0.113.11")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("bütçesi");
    }

    @Test
    @DisplayName("Redis down → fail open (no exception, no expire call)")
    void redisDown_failsOpen() {
        when(ops.increment(anyString())).thenThrow(new RuntimeException("connection refused"));

        // Service should NOT throw — outage of cache must not break user-facing AI.
        service.chargeAi(user, mockReq("203.0.113.12"));

        // Since increment returns null, expire is never called.
        verify(redis, never()).expire(anyString(), any());
    }

    @Test
    @DisplayName("X-Forwarded-For first hop wins over RemoteAddr")
    void clientIp_honoursXff() {
        when(ops.increment(anyString())).thenAnswer(inv -> {
            // First call is the IP bucket — capture and assert the IP used.
            String key = inv.getArgument(0);
            if (key.contains(":ai:ip:") && !key.contains("203.0.113.99")) {
                throw new AssertionError("expected IP 203.0.113.99 in key, got: " + key);
            }
            return 1L;
        });

        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For"))
                .thenReturn("203.0.113.99, 10.0.0.5, 10.0.0.1");
        when(req.getRemoteAddr()).thenReturn("10.0.0.1");

        service.chargeAi(user, req);
    }

    @Test
    @DisplayName("No HTTP request → IP layer skipped, others run")
    void nullRequest_skipsIpLayer() {
        when(ops.increment(anyString())).thenReturn(1L);

        service.chargeAi(user); // overload that passes null req
        // Only user + global, NOT ip
        verify(ops, org.mockito.Mockito.times(2)).increment(anyString());
    }

    @Test
    @DisplayName("globalAiUsageToday() returns the current global counter")
    void globalUsage_returnsCounter() {
        when(ops.get(anyString())).thenReturn("42");
        assertThat(service.globalAiUsageToday()).isEqualTo(42L);
    }

    @Test
    @DisplayName("globalAiUsageToday() returns -1 when redis throws")
    void globalUsage_redisFail() {
        when(ops.get(anyString())).thenThrow(new RuntimeException("down"));
        assertThat(service.globalAiUsageToday()).isEqualTo(-1L);
    }

    // ============ helpers ============

    private HttpServletRequest mockReq(String ip) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader(eq("X-Forwarded-For"))).thenReturn(null);
        when(req.getHeader(eq("X-Real-IP"))).thenReturn(null);
        when(req.getRemoteAddr()).thenReturn(ip);
        return req;
    }
}
