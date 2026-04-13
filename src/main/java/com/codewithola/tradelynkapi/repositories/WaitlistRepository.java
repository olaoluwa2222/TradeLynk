package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Waitlist Repository
 * Handles database operations for waitlist entries
 */
public interface WaitlistRepository extends JpaRepository<Waitlist, UUID> {

    /**
     * Find waitlist entry by email (case-insensitive)
     * @param email the email address to search for
     * @return Optional containing the waitlist entry if found
     */
    @Query("SELECT w FROM Waitlist w WHERE LOWER(w.email) = LOWER(:email)")
    Optional<Waitlist> findByEmailIgnoreCase(@Param("email") String email);

    /**
     * Check if email exists in waitlist (case-insensitive)
     * @param email the email to check
     * @return true if email exists, false otherwise
     */
    @Query("SELECT COUNT(w) > 0 FROM Waitlist w WHERE LOWER(w.email) = LOWER(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String email);

    /**
     * Find waitlist entry by exact email
     * @param email the email address
     * @return Optional containing the waitlist entry if found
     */
    Optional<Waitlist> findByEmail(String email);
}

