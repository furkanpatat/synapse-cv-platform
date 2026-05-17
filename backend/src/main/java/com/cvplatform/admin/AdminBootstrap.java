package com.cvplatform.admin;

import com.cvplatform.user.Role;
import com.cvplatform.user.SubscriptionType;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;

/**
 * Creates a default ADMIN account at startup if none exists.
 * Configure via app.admin.bootstrap-email and app.admin.bootstrap-password
 * (defaults: admin@cv.local / change-me-admin).
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap {

    /** Passwords known to be weak / committed defaults — refused in prod. */
    private static final List<String> KNOWN_WEAK_PASSWORDS = List.of(
            "change-me-admin", "admin", "password", "12345", "changeme");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${app.admin.bootstrap-email:admin@cv.local}")
    private String email;

    @Value("${app.admin.bootstrap-password:change-me-admin}")
    private String password;

    @Bean
    public ApplicationRunner adminBootstrapRunner() {
        return args -> {
            boolean adminExists = userRepository.findAll().stream()
                    .anyMatch(u -> u.getRole() == Role.ADMIN);
            if (adminExists) {
                log.info("Admin account already exists — skipping bootstrap");
                return;
            }

            boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
            String pw = password == null ? "" : password.trim();

            // SAFETY: never seed a weak/default admin in production. Either
            // the operator provides a strong password via env, or the
            // application refuses to start so the deploy is rolled back
            // before anyone notices the open admin.
            if (isProd) {
                if (KNOWN_WEAK_PASSWORDS.contains(pw.toLowerCase()) || pw.length() < 16) {
                    throw new IllegalStateException(
                            "Refusing to seed bootstrap admin in prod with a weak password. "
                                    + "Set ADMIN_BOOTSTRAP_PASSWORD to at least 16 chars and not "
                                    + "a known default. Got length=" + pw.length() + ".");
                }
            } else if (KNOWN_WEAK_PASSWORDS.contains(pw.toLowerCase())) {
                log.warn("==> Bootstrap admin using a KNOWN weak password ({}). "
                        + "Fine for dev, but FAILS in prod profile.", pw);
            }

            User admin = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(pw))
                    .role(Role.ADMIN)
                    .subscriptionType(SubscriptionType.ENTERPRISE)
                    .firstName("Platform")
                    .lastName("Admin")
                    .emailVerified(true)
                    .banned(false)
                    .build();
            userRepository.save(admin);
            log.warn("==> Bootstrap admin created: {} — CHANGE the password on first login", email);
        };
    }
}
