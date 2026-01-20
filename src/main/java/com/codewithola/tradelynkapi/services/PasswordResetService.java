package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.entity.PasswordResetToken;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.InvalidTokenException;
import com.codewithola.tradelynkapi.exception.ResourceNotFoundException;
import com.codewithola.tradelynkapi.exception.WeakPasswordException;
import com.codewithola.tradelynkapi.repositories.PasswordResetTokenRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Password Reset Service
 * Handles forgot password flow: request, verify, reset
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // Password pattern: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");

    // Token expiry duration (1 hour)
    private static final int TOKEN_EXPIRY_HOURS = 1;

    /**
     * Step 1: Request password reset
     * Generates token and sends reset email
     *
     * @param email User's email
     * @throws ResourceNotFoundException if user not found
     */
    @Transactional
    public void requestPasswordReset(String email) {
        log.info("Password reset requested for email: {}", email);

        // 1️⃣ Find user by email
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> {
                    log.warn("Password reset requested for non-existent email: {}", email);
                    // Don't reveal if email exists (security)
                    // But still throw exception internally
                    return new ResourceNotFoundException("User not found with email: " + email);
                });

        // 2️⃣ Check if user is active
        if (!user.getIsActive()) {
            log.warn("Password reset requested for inactive account: {}", email);
            throw new IllegalStateException("Account is deactivated. Please contact support.");
        }

        // 3️⃣ Delete any existing reset tokens for this user
        tokenRepository.deleteByUserId(user.getId());
        tokenRepository.flush(); // Ensure deletion before insertion

        // 4️⃣ Generate unique reset token
        String token = UUID.randomUUID().toString();

        // 5️⃣ Create token entity
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS))
                .isUsed(false)
                .build();

        tokenRepository.save(resetToken);

        // 6️⃣ Send reset email
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);

        log.info("✅ Password reset email sent to: {}", email);
    }

    /**
     * Step 2: Verify reset token
     * Checks if token is valid (exists, not expired, not used)
     *
     * @param token Reset token from URL
     * @return User associated with token
     * @throws InvalidTokenException if token is invalid
     */
    @Transactional(readOnly = true)
    public User verifyResetToken(String token) {
        log.info("Verifying password reset token");

        // 1️⃣ Find token in database
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Invalid reset token attempted");
                    return new InvalidTokenException("Invalid or expired reset token");
                });

        // 2️⃣ Check if token is expired
        if (resetToken.isExpired()) {
            log.warn("Expired reset token used for user: {}", resetToken.getUser().getEmail());
            throw new InvalidTokenException("Reset token has expired. Please request a new one.");
        }

        // 3️⃣ Check if token was already used
        if (resetToken.getIsUsed()) {
            log.warn("Already-used reset token attempted for user: {}", resetToken.getUser().getEmail());
            throw new InvalidTokenException("Reset token has already been used. Please request a new one.");
        }

        log.info("✅ Reset token verified successfully for user: {}", resetToken.getUser().getEmail());

        return resetToken.getUser();
    }

    /**
     * Step 3: Reset password
     * Updates user's password and marks token as used
     *
     * @param token Reset token
     * @param newPassword New password (plain text - will be hashed)
     * @throws InvalidTokenException if token is invalid
     * @throws WeakPasswordException if password doesn't meet requirements
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Processing password reset");

        // 1️⃣ Validate password strength
        validatePasswordStrength(newPassword);

        // 2️⃣ Find and verify token
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Invalid reset token during password reset");
                    return new InvalidTokenException("Invalid or expired reset token");
                });

        // 3️⃣ Check if token is valid
        if (!resetToken.isValid()) {
            log.warn("Invalid/expired token used for password reset: {}", resetToken.getUser().getEmail());
            throw new InvalidTokenException("Reset token is invalid or has expired");
        }

        // 4️⃣ Get user and update password
        User user = resetToken.getUser();
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPasswordHash(hashedPassword);
        userRepository.save(user);

        // 5️⃣ Mark token as used (prevent reuse)
        resetToken.setIsUsed(true);
        tokenRepository.save(resetToken);

        // 6️⃣ Send confirmation email
        emailService.sendPasswordResetConfirmationEmail(user.getEmail(), user.getName());

        log.info("✅ Password reset successfully for user: {}", user.getEmail());
    }

    /**
     * Validate password strength
     *
     * @param password Password to validate
     * @throws WeakPasswordException if password doesn't meet requirements
     */
    private void validatePasswordStrength(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new WeakPasswordException("Password cannot be empty");
        }

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            log.error("Weak password provided during reset");
            throw new WeakPasswordException(
                    "Password must be at least 8 characters with uppercase, lowercase, and number"
            );
        }
    }

    /**
     * Cleanup expired tokens (scheduled task)
     * Should be called periodically (e.g., daily via @Scheduled)
     */
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Cleaning up expired password reset tokens");
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }

    /**
     * Check if user has an active reset token
     * Useful for rate limiting
     *
     * @param email User's email
     * @return true if user has active token
     */
    @Transactional(readOnly = true)
    public boolean hasActiveResetToken(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElse(null);

        if (user == null) {
            return false;
        }

        long activeTokens = tokenRepository.countActiveTokensByUserId(user.getId(), LocalDateTime.now());
        return activeTokens > 0;
    }
}