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
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Creates a default ADMIN account at startup if none exists.
 * Configure via app.admin.bootstrap-email and app.admin.bootstrap-password
 * (defaults: admin@cv.local / change-me-admin).
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
            User admin = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(Role.ADMIN)
                    .subscriptionType(SubscriptionType.ENTERPRISE)
                    .firstName("Platform")
                    .lastName("Admin")
                    .emailVerified(true)
                    .banned(false)
                    .build();
            userRepository.save(admin);
            log.warn("==> Bootstrap admin created: {} (default password — CHANGE IT)", email);
        };
    }
}
