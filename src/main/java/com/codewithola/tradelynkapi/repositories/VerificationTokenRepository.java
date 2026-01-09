package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.VerificationToken;
import com.codewithola.tradelynkapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    /**
     * Find verification token by token string
     */
    Optional<VerificationToken> findByToken(String token);

    /**
     * Find verification token by user
     */
    Optional<VerificationToken> findByUser(User user);

    /**
     * Delete verification token by user ID
     * This is critical for the resend verification feature
     */
    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    /**
     * Check if a verification token exists for a user
     */
    boolean existsByUser(User user);
}