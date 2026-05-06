package com.licenta.user.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String username, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("GeoAtlas · Resetare parolă");
            helper.setText(buildEmailHtml(username, resetLink), true);

            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }

    private String buildEmailHtml(String username, String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4efe6;font-family:monospace;">
              <div style="max-width:520px;margin:40px auto;background:#ffffff;border:1px solid #d1fae5;border-radius:4px;overflow:hidden;">
                <div style="background:#064e3b;padding:24px 32px;">
                  <div style="color:#6ee7b7;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:6px;">GEO·ATLAS</div>
                  <div style="color:#ffffff;font-size:20px;font-weight:600;">Resetare parolă</div>
                </div>
                <div style="padding:32px;">
                  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
                    Salut, <strong>%s</strong>.
                  </p>
                  <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
                    Am primit o cerere de resetare a parolei pentru contul tău GeoAtlas.
                    Apasă butonul de mai jos pentru a seta o parolă nouă. Link-ul este valabil <strong>1 oră</strong>.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="%s"
                       style="background:#065f46;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;display:inline-block;">
                      Resetează parola →
                    </a>
                  </div>
                  <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:24px 0 0;border-top:1px solid #f3f4f6;padding-top:16px;">
                    Dacă nu ai solicitat resetarea parolei, ignoră acest email.
                    Parola ta rămâne neschimbată.<br><br>
                    Link: <a href="%s" style="color:#059669;">%s</a>
                  </p>
                </div>
                <div style="background:#f9fafb;padding:12px 32px;border-top:1px solid #f3f4f6;">
                  <span style="color:#9ca3af;font-size:10px;letter-spacing:0.2em;">GeoAtlas · Cartographic Console v2 · jwt · hs256</span>
                </div>
              </div>
            </body>
            </html>
            """.formatted(username, resetLink, resetLink, resetLink);
    }
}
