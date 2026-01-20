package com.codewithola.tradelynkapi.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
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

    /**
     * Send password reset email with reset link
     *
     * @param toEmail Recipient's email
     * @param userName Recipient's name
     * @param resetToken Password reset token
     */
    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        log.info("Sending password reset email to: {}", toEmail);

        // 1️⃣ Build reset URL
        String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;

        // 2️⃣ Build email content
        String subject = "Reset Your TradeLynk Password";

        String body = String.format("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .button:hover { background: #764ba2; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hi <strong>%s</strong>,</p>
                    
                    <p>We received a request to reset your TradeLynk password. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center;">
                        <a href="%s" class="button">Reset Password</a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
                        <a href="%s">%s</a>
                    </p>
                    
                    <div class="warning">
                        ⚠️ <strong>Important:</strong>
                        <ul>
                            <li>This link will expire in <strong>1 hour</strong></li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>Your password won't change until you create a new one</li>
                        </ul>
                    </div>
                    
                    <p>For security reasons:</p>
                    <ul>
                        <li>✅ Use a strong password (min 8 characters, with uppercase, lowercase, and number)</li>
                        <li>✅ Don't share your password with anyone</li>
                        <li>✅ Use a unique password for TradeLynk</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>TradeLynk - Campus Marketplace</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """,
                userName,
                resetUrl,
                resetUrl,
                resetUrl
        );

        // 3️⃣ Send email
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("✅ Password reset email sent successfully to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("❌ Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    /**
     * Send password reset confirmation email
     *
     * @param toEmail Recipient's email
     * @param userName Recipient's name
     */
    public void sendPasswordResetConfirmationEmail(String toEmail, String userName) {
        log.info("Sending password reset confirmation to: {}", toEmail);

        String subject = "Your TradeLynk Password Has Been Reset";

        String body = String.format("""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #28a745 0%%, #20c997 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                .alert { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Password Reset Successful</h1>
                </div>
                <div class="content">
                    <p>Hi <strong>%s</strong>,</p>
                    
                    <p>Your TradeLynk password has been successfully reset.</p>
                    
                    <p>You can now log in with your new password:</p>
                    
                    <div style="text-align: center;">
                        <a href="%s/login" class="button">Log In Now</a>
                    </div>
                    
                    <div class="alert">
                        🔒 <strong>Security Notice:</strong><br>
                        If you did NOT make this change, please contact us immediately at support@tradelynk.com
                    </div>
                    
                    <p>For your account security:</p>
                    <ul>
                        <li>✅ Keep your password confidential</li>
                        <li>✅ Use two-factor authentication if available</li>
                        <li>✅ Log out from shared devices</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>TradeLynk - Campus Marketplace</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """,
                userName,
                frontendUrl
        );

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("✅ Password reset confirmation sent to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("❌ Failed to send confirmation email to: {}", toEmail, e);
            // Don't throw exception - password was already reset
        }
    }

}
