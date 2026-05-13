package com.cvplatform.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    /** Nullable to allow OAuth-only signups (no local password). */
    @Column(name = "password_hash")
    private String passwordHash;

    /** GOOGLE or GITHUB if the account was created via OAuth, else null. */
    @Column(name = "oauth_provider", length = 20)
    private String oauthProvider;

    /** Provider's stable subject id (Google sub, GitHub user id). */
    @Column(name = "oauth_subject", length = 255)
    private String oauthSubject;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "totp_secret", length = 64)
    private String totpSecret;

    @Column(name = "totp_enabled", nullable = false)
    @Builder.Default
    private boolean totpEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_type", nullable = false, length = 32)
    @Builder.Default
    private SubscriptionType subscriptionType = SubscriptionType.FREE;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 100)
    private String city;

    @Column(length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "github_url", length = 500)
    private String githubUrl;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean banned = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
