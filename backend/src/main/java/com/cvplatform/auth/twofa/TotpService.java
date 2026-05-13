package com.cvplatform.auth.twofa;

import com.cvplatform.common.ApiException;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.util.Utils;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper around dev.samstevens.totp.
 *
 * Issuer label = "Synapse CV Platform", account = user's email.
 * Verification window = ±1 step (30 s) to absorb client clock skew.
 */
@Service
public class TotpService {

    private static final String ISSUER = "Synapse CV Platform";

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final CodeVerifier verifier = new DefaultCodeVerifier(
            new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6),
            new SystemTimeProvider());

    public TotpService() {
        ((DefaultCodeVerifier) verifier).setAllowedTimePeriodDiscrepancy(1);
        ((DefaultCodeVerifier) verifier).setTimePeriod(30);
    }

    public String newSecret() {
        return secretGenerator.generate();
    }

    /** Returns a `data:image/png;base64,...` URI safe to embed in <img src>. */
    public String qrDataUri(String secret, String accountEmail) {
        QrData data = new QrData.Builder()
                .label(accountEmail)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        try {
            byte[] png = qrGenerator.generate(data);
            return Utils.getDataUriForImage(png, qrGenerator.getImageMimeType());
        } catch (QrGenerationException ex) {
            throw ApiException.badRequest("QR_GENERATION_FAILED",
                    "Could not render the TOTP QR code");
        }
    }

    public boolean verify(String secret, String code) {
        if (secret == null || code == null) return false;
        String trimmed = code.replaceAll("\\s+", "");
        if (trimmed.length() != 6 || !trimmed.matches("\\d{6}")) return false;
        return verifier.isValidCode(secret, trimmed);
    }

    /** The raw otpauth:// URI — handy as a manual-entry fallback. */
    public String otpAuthUri(String secret, String accountEmail) {
        return "otpauth://totp/" + url(ISSUER) + ":" + url(accountEmail)
                + "?secret=" + secret
                + "&issuer=" + url(ISSUER)
                + "&algorithm=SHA1&digits=6&period=30";
    }

    private static String url(String s) {
        return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8);
    }
}
