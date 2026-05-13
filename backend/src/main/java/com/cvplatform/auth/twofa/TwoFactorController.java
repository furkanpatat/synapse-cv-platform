package com.cvplatform.auth.twofa;

import com.cvplatform.audit.AuditService;
import com.cvplatform.common.ApiException;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final TotpService totpService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    /**
     * Step 1 of enrollment — generate (but don't yet activate) a secret.
     * Returns the otpauth URI + a ready-to-display QR data-URI. The secret is
     * persisted with totp_enabled=false; the user must POST a valid code to
     * /verify to flip it on.
     */
    @PostMapping("/setup")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, Object>> setup(@AuthenticationPrincipal User user) {
        if (user.isTotpEnabled()) {
            throw ApiException.conflict("TOTP_ALREADY_ENABLED",
                    "İki adımlı doğrulama zaten açık — önce kapatmalısın");
        }
        String secret = totpService.newSecret();
        User managed = userRepository.findById(user.getId()).orElseThrow();
        managed.setTotpSecret(secret);
        managed.setTotpEnabled(false);
        userRepository.save(managed);

        return ResponseEntity.ok(Map.of(
                "secret", secret,
                "qrDataUri", totpService.qrDataUri(secret, managed.getEmail()),
                "otpAuthUri", totpService.otpAuthUri(secret, managed.getEmail())
        ));
    }

    /** Step 2 — user types the first generated code, we flip totp_enabled. */
    @PostMapping("/verify")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, Object>> verify(@AuthenticationPrincipal User user,
                                                       @RequestBody Map<String, String> body) {
        User managed = userRepository.findById(user.getId()).orElseThrow();
        if (managed.getTotpSecret() == null) {
            throw ApiException.badRequest("TOTP_NOT_SETUP",
                    "Önce /setup ile QR oluştur");
        }
        String code = body.getOrDefault("code", "");
        if (!totpService.verify(managed.getTotpSecret(), code)) {
            throw ApiException.badRequest("TOTP_INVALID", "Kod hatalı");
        }
        managed.setTotpEnabled(true);
        userRepository.save(managed);
        auditService.log("auth.2fa.enabled", managed, "İki adımlı doğrulama açıldı");
        return ResponseEntity.ok(Map.of("enabled", true));
    }

    /** Disable — requires a current code to prove the user still has the device. */
    @PostMapping("/disable")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, Object>> disable(@AuthenticationPrincipal User user,
                                                        @RequestBody Map<String, String> body) {
        User managed = userRepository.findById(user.getId()).orElseThrow();
        if (!managed.isTotpEnabled()) {
            return ResponseEntity.ok(Map.of("enabled", false));
        }
        String code = body.getOrDefault("code", "");
        if (!totpService.verify(managed.getTotpSecret(), code)) {
            throw ApiException.badRequest("TOTP_INVALID", "Kod hatalı");
        }
        managed.setTotpEnabled(false);
        managed.setTotpSecret(null);
        userRepository.save(managed);
        auditService.log("auth.2fa.disabled", managed, "İki adımlı doğrulama kapatıldı");
        return ResponseEntity.ok(Map.of("enabled", false));
    }

    /** Read-only status — used by the profile UI to render the right CTA. */
    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> status(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("enabled", user.isTotpEnabled()));
    }
}
