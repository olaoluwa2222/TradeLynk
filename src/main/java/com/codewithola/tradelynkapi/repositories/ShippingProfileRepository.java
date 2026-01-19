package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.ShippingProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShippingProfileRepository extends JpaRepository<ShippingProfile, Long> {

    /**
     * Find all shipping profiles for a seller
     */
    List<ShippingProfile> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    /**
     * Find active shipping profiles for a seller
     */
    List<ShippingProfile> findBySellerIdAndIsActiveTrueOrderByCreatedAtDesc(Long sellerId);

    /**
     * Find default shipping profile for a seller
     */
    Optional<ShippingProfile> findBySellerIdAndIsDefaultTrue(Long sellerId);

    /**
     * Check if seller has any shipping profiles
     */
    boolean existsBySellerId(Long sellerId);

    /**
     * Count shipping profiles for a seller
     */
    long countBySellerId(Long sellerId);

    /**
     * Find shipping profile by seller and name
     */
    Optional<ShippingProfile> findBySellerIdAndName(Long sellerId, String name);
}