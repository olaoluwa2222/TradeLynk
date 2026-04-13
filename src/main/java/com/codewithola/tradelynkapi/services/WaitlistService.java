package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.requests.WaitlistRequest;
import com.codewithola.tradelynkapi.dtos.response.WaitlistResponse;
import com.codewithola.tradelynkapi.entity.Waitlist;
import com.codewithola.tradelynkapi.repositories.WaitlistRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Waitlist Service
 * Handles business logic for waitlist signup
 * - Email normalization and validation
 * - Duplicate detection
 * - Safe error handling
 */
@Service
@Slf4j
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;

    private static final String DEFAULT_SOURCE = "go.tradelynk.app";

    @Autowired
    public WaitlistService(WaitlistRepository waitlistRepository) {
        this.waitlistRepository = waitlistRepository;
    }

    /**
     * Add email to waitlist
     * - Normalizes email to lowercase and trims whitespace
     * - Checks for duplicates (case-insensitive)
     * - Returns duplicate indication if email already exists
     * - Logs safely without exposing sensitive data
     *
     * @param request WaitlistRequest containing email and optional source
     * @return WaitlistResponse with success details
     */
    @Transactional
    public WaitlistResponse addToWaitlist(WaitlistRequest request) {
        // Normalize email: lowercase and trim
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        // Set source with default if not provided
        String source = request.getSource() != null && !request.getSource().isBlank()
                ? request.getSource()
                : DEFAULT_SOURCE;

        log.info("Processing waitlist signup - source: {}", source);

        // Check if email already exists (case-insensitive)
        Optional<Waitlist> existingEntry = waitlistRepository.findByEmailIgnoreCase(normalizedEmail);

        if (existingEntry.isPresent()) {
            log.info("Duplicate waitlist signup attempt - source: {}", source);
            Waitlist entry = existingEntry.get();
            return WaitlistResponse.builder()
                    .id(entry.getId())
                    .email(entry.getEmail())
                    .source(entry.getSource())
                    .createdAt(entry.getCreatedAt())
                    .isDuplicate(true)
                    .build();
        }

        // Create new waitlist entry
        Waitlist newEntry = Waitlist.builder()
                .email(normalizedEmail)
                .source(source)
                .build();

        // Save to database
        try {
            Waitlist savedEntry = waitlistRepository.save(newEntry);
            log.info("Successfully added email to waitlist - source: {}", source);

            return WaitlistResponse.builder()
                    .id(savedEntry.getId())
                    .email(savedEntry.getEmail())
                    .source(savedEntry.getSource())
                    .createdAt(savedEntry.getCreatedAt())
                    .isDuplicate(false)
                    .build();
        } catch (Exception e) {
            log.error("Error adding email to waitlist - source: {}", source, e);
            throw new RuntimeException("Failed to add email to waitlist. Please try again later.", e);
        }
    }

    /**
     * Check if an email is already on the waitlist
     * @param email the email to check
     * @return true if exists, false otherwise
     */
    public boolean isEmailOnWaitlist(String email) {
        return waitlistRepository.existsByEmailIgnoreCase(email.toLowerCase().trim());
    }

    /**
     * Get waitlist entry by email
     * @param email the email to search for
     * @return WaitlistResponse if found
     */
    public Optional<WaitlistResponse> getWaitlistEntry(String email) {
        return waitlistRepository.findByEmailIgnoreCase(email.toLowerCase().trim())
                .map(entry -> WaitlistResponse.builder()
                        .id(entry.getId())
                        .email(entry.getEmail())
                        .source(entry.getSource())
                        .createdAt(entry.getCreatedAt())
                        .isDuplicate(false)
                        .build());
    }

    /**
     * Get total count of waitlist entries
     * @return number of waitlist entries
     */
    public long getWaitlistCount() {
        return waitlistRepository.count();
    }
}

