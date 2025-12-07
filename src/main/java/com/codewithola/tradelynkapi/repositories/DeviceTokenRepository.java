package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    /**
     * Find all active device tokens for a user
     */
    List<DeviceToken> findByUserIdAndIsActiveTrue(Long userId);

    /**
     * Find device token by token string
     */
    Optional<DeviceToken> findByDeviceToken(String deviceToken);

    /**
     * Delete device token by token string
     */
    void deleteByDeviceToken(String deviceToken);

    /**
     * Deactivate old inactive tokens (cleanup)
     */
    @Modifying
    @Query("UPDATE DeviceToken dt SET dt.isActive = false WHERE dt.lastUsedAt < :cutoffDate")
    void deactivateOldTokens(LocalDateTime cutoffDate);

    /**
     * Count active tokens for a user
     */
    long countByUserIdAndIsActiveTrue(Long userId);
}