package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for Password Reset Token operations
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find token by token string
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Find valid (non-expired, non-used) token for a user
     */
    @Query("""
        SELECT t FROM PasswordResetToken t 
        WHERE t.user.id = :userId 
        AND t.isUsed = false 
        AND t.expiryDate > :now
        ORDER BY t.createdAt DESC
        """)
    Optional<PasswordResetToken> findValidTokenByUserId(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    /**
     * Delete all tokens for a user (cleanup before creating new token)
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    /**
     * Delete expired tokens (cleanup task)
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Count active tokens for a user
     */
    @Query("""
        SELECT COUNT(t) FROM PasswordResetToken t 
        WHERE t.user.id = :userId 
        AND t.isUsed = false 
        AND t.expiryDate > :now
        """)
    long countActiveTokensByUserId(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );
}