package com.cvplatform.auth.twofa;

import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit tests — no Spring context, no Docker. Verifies our TOTP wrapper
 * behaves correctly for the cases that matter at login time: secret
 * generation, code verification, skew tolerance, and the QR data URI shape.
 */
class TotpServiceTest {

    private final TotpService service = new TotpService();
    private final DefaultCodeGenerator codeGen =
            new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
    private final SystemTimeProvider time = new SystemTimeProvider();

    @Test
    @DisplayName("newSecret yields a 32-char base32 secret")
    void newSecret_isReasonableLength() {
        String secret = service.newSecret();
        assertThat(secret)
                .isNotBlank()
                .matches("[A-Z2-7]+")            // RFC4648 base32 charset
                .hasSizeGreaterThanOrEqualTo(16); // dev.samstevens default is 32
    }

    @Test
    @DisplayName("verify() accepts a code generated for the current 30s bucket")
    void verify_currentCode_ok() throws Exception {
        String secret = service.newSecret();
        long bucket = time.getTime() / 30;
        String code = codeGen.generate(secret, bucket);

        assertThat(service.verify(secret, code)).isTrue();
    }

    @Test
    @DisplayName("verify() tolerates ±1 step clock skew")
    void verify_oneStepSkew_ok() throws Exception {
        String secret = service.newSecret();
        long bucket = time.getTime() / 30;
        // Code generated for the *previous* 30s window — should still be
        // accepted because our verifier is configured with discrepancy=1.
        String prevCode = codeGen.generate(secret, bucket - 1);
        String nextCode = codeGen.generate(secret, bucket + 1);

        assertThat(service.verify(secret, prevCode)).isTrue();
        assertThat(service.verify(secret, nextCode)).isTrue();
    }

    @Test
    @DisplayName("verify() rejects a stale code outside the skew window")
    void verify_oldCode_rejected() throws Exception {
        String secret = service.newSecret();
        long bucket = time.getTime() / 30;
        String staleCode = codeGen.generate(secret, bucket - 10); // 5 min old

        assertThat(service.verify(secret, staleCode)).isFalse();
    }

    @Test
    @DisplayName("verify() rejects non-numeric and wrong-length input safely")
    void verify_malformed_input() {
        String secret = service.newSecret();
        assertThat(service.verify(secret, null)).isFalse();
        assertThat(service.verify(secret, "")).isFalse();
        assertThat(service.verify(secret, "abc")).isFalse();      // not digits
        assertThat(service.verify(secret, "12345")).isFalse();    // too short
        assertThat(service.verify(secret, "1234567")).isFalse();  // too long
        assertThat(service.verify(null, "123456")).isFalse();     // no secret
    }

    @Test
    @DisplayName("verify() ignores surrounding whitespace")
    void verify_trimsWhitespace() throws Exception {
        String secret = service.newSecret();
        long bucket = time.getTime() / 30;
        String code = codeGen.generate(secret, bucket);

        assertThat(service.verify(secret, "  " + code + "  ")).isTrue();
    }

    @Test
    @DisplayName("qrDataUri returns a PNG data URI")
    void qrDataUri_shape() {
        String secret = service.newSecret();
        String uri = service.qrDataUri(secret, "ayse@example.com");

        assertThat(uri)
                .startsWith("data:image/png;base64,")
                .hasSizeGreaterThan(200); // a real PNG payload, not a stub
    }

    @Test
    @DisplayName("otpAuthUri encodes issuer + account + secret correctly")
    void otpAuthUri_shape() {
        String secret = "JBSWY3DPEHPK3PXP";
        String uri = service.otpAuthUri(secret, "ayşe+test@example.com");

        assertThat(uri)
                .startsWith("otpauth://totp/")
                .contains("Synapse+CV+Platform") // url-encoded issuer
                .contains("secret=" + secret)
                .contains("algorithm=SHA1")
                .contains("digits=6")
                .contains("period=30");
    }
}
