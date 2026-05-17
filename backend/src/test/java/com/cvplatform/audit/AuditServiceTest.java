package com.cvplatform.audit;

import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Behaviour we care about:
 *   - actor fields (id / email / role) are copied off the User onto the
 *     AuditLog row
 *   - summary is truncated to 500 chars (column limit)
 *   - logAnonymous() works without an actor
 *   - logLoginFailed() preserves the attempted email even though there's
 *     no actor (otherwise the audit row would be useless)
 *   - a swallowed DB exception inside recordAsync() does NOT propagate to
 *     the caller — the caller (login, job create, etc.) must never fail
 *     because of an audit insert.
 */
class AuditServiceTest {

    private AuditLogRepository repo;
    private AuditService service;

    @BeforeEach
    void setUp() {
        repo = mock(AuditLogRepository.class);
        // The save returns the entity unchanged in normal cases.
        when(repo.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));
        service = new AuditService(repo);
    }

    @Test
    @DisplayName("log() copies actor identity fields onto the AuditLog")
    void log_copiesActorFields() {
        UUID actorId = UUID.randomUUID();
        User actor = User.builder()
                .id(actorId)
                .email("ayse@example.com")
                .role(Role.USER)
                .build();

        service.log("auth.login.success", actor, "Giriş yapıldı");

        ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo, times(1)).save(cap.capture());
        AuditLog saved = cap.getValue();

        assertThat(saved.getEventType()).isEqualTo("auth.login.success");
        assertThat(saved.getActorId()).isEqualTo(actorId);
        assertThat(saved.getActorEmail()).isEqualTo("ayse@example.com");
        assertThat(saved.getActorRole()).isEqualTo("USER");
        assertThat(saved.getSummary()).isEqualTo("Giriş yapıldı");
        assertThat(saved.getMetadata()).isNotNull(); // never null even when empty
    }

    @Test
    @DisplayName("log() with metadata + target stores them verbatim")
    void log_targetAndMetadata() {
        User actor = User.builder()
                .id(UUID.randomUUID()).email("hr@acme.com").role(Role.COMPANY).build();
        UUID jobId = UUID.randomUUID();

        service.log("job.created", actor, "job", jobId.toString(),
                "İlan oluşturuldu", Map.of("title", "Backend Dev"));

        ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(cap.capture());
        AuditLog saved = cap.getValue();

        assertThat(saved.getTargetType()).isEqualTo("job");
        assertThat(saved.getTargetId()).isEqualTo(jobId.toString());
        assertThat(saved.getMetadata()).containsEntry("title", "Backend Dev");
    }

    @Test
    @DisplayName("logAnonymous() works without an actor")
    void logAnonymous_noActor() {
        service.logAnonymous("system.boot", "Servis ayağa kalktı",
                Map.of("version", "0.2.0"));

        ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(cap.capture());
        AuditLog saved = cap.getValue();

        assertThat(saved.getActorId()).isNull();
        assertThat(saved.getActorEmail()).isNull();
        assertThat(saved.getActorRole()).isNull();
        assertThat(saved.getEventType()).isEqualTo("system.boot");
        assertThat(saved.getMetadata()).containsEntry("version", "0.2.0");
    }

    @Test
    @DisplayName("logLoginFailed() preserves the attempted email even with no actor")
    void logLoginFailed_keepsEmail() {
        service.logLoginFailed("intruder@example.com", "bad_password");

        ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(cap.capture());
        AuditLog saved = cap.getValue();

        assertThat(saved.getActorId()).isNull();
        assertThat(saved.getActorEmail()).isEqualTo("intruder@example.com");
        assertThat(saved.getEventType()).isEqualTo(AuditEventType.LOGIN_FAILED);
        assertThat(saved.getMetadata())
                .containsEntry("email", "intruder@example.com")
                .containsEntry("reason", "bad_password");
    }

    @Test
    @DisplayName("a 600-char summary is truncated to 500 chars (column limit)")
    void log_truncatesLongSummary() {
        User actor = User.builder()
                .id(UUID.randomUUID()).email("x@x").role(Role.USER).build();
        String summary = "x".repeat(600);

        service.log("test", actor, summary);

        ArgumentCaptor<AuditLog> cap = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo).save(cap.capture());
        assertThat(cap.getValue().getSummary()).hasSize(500);
    }

    @Test
    @DisplayName("a DB failure inside recordAsync() is swallowed (callers never throw)")
    void recordAsync_dbFailureSwallowed() {
        when(repo.save(any(AuditLog.class)))
                .thenThrow(new RuntimeException("postgres down"));
        User actor = User.builder()
                .id(UUID.randomUUID()).email("a@b").role(Role.USER).build();

        // Must NOT propagate — if this throws, login / job create / etc.
        // would all be broken every time the audit table is unhappy.
        service.log("auth.login.success", actor, "Giriş yapıldı");

        verify(repo, times(1)).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("tid() helper handles null safely")
    void tid_nullSafe() {
        assertThat(AuditService.tid(null)).isNull();
        UUID id = UUID.randomUUID();
        assertThat(AuditService.tid(id)).isEqualTo(id.toString());
    }
}
