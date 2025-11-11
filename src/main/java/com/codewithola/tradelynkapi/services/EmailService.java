package com.codewithola.tradelynkapi.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendVerificationEmail(String toEmail, String token) {
        try {
            String verifyUrl = frontendUrl + "/verify?token=" + token;

            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(senderEmail);
            mailMessage.setTo(toEmail);
            mailMessage.setSubject("Verify your Landmark Marketplace account");
            mailMessage.setText("""
                    Welcome to Landmark Marketplace!
                    
                    Click the link below to verify your email:
                    %s
                    
                    Note: This link expires in 24 hours.
                    """.formatted(verifyUrl));

            mailSender.send(mailMessage);

            log.info("✅ Verification email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send verification email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body); // true = HTML support
            message.setFrom("noreply@tradelynk.com"); // change this to your app email
            mailSender.send(message);

            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
            throw new RuntimeException("Failed to send email notification");
        }
    }
}
