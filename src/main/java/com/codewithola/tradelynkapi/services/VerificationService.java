package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.entity.VerificationToken;
import com.codewithola.tradelynkapi.exception.InvalidTokenException;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import com.codewithola.tradelynkapi.repositories.VerificationTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationService {

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService; // 🔹 Now injected here

    @Transactional
    public void sendVerificationEmail(User user) {
        // Delete existing token (optional cleanup)
        tokenRepository.findByUser(user).ifPresent(tokenRepository::delete);

        // Generate unique token
        String token = UUID.randomUUID().toString();

        // Create token entity
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();

        tokenRepository.save(verificationToken);

        // 🔹 Delegate email sending to EmailService
        emailService.sendVerificationEmail(user.getEmail(), token);

        log.info("Verification email sent to {}", user.getEmail());
    }

    @Transactional
    public void verifyEmail(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid verification token"));

        if (verificationToken.isExpired()) {
            throw new InvalidTokenException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setIsEmailVerified(true);
        userRepository.save(user);

        tokenRepository.delete(verificationToken);

        log.info("User {} verified successfully", user.getEmail());
    }
}
