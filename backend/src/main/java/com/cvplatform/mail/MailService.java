package com.cvplatform.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@cvplatform.local}")
    private String from;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    public void sendVerificationEmail(String to, String token) {
        String link = frontendBaseUrl + "/verify-email?token=" + token;
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(to);
        msg.setSubject("CV Platform — E-posta Doğrulama");
        msg.setText("""
                Merhaba,

                Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:
                %s

                Bağlantı 24 saat içinde geçerlidir.

                CV Platform
                """.formatted(link));
        try {
            mailSender.send(msg);
            log.info("Verification email sent to {}", to);
        } catch (Exception ex) {
            log.error("Failed to send verification email to {}: {}", to, ex.getMessage());
        }
    }
}
