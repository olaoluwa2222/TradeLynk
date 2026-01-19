package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    /**
     * Find all variants for a specific item
     */
    List<ProductVariant> findByItemIdOrderByPositionAsc(Long itemId);

    /**
     * Find default variant for an item
     */
    Optional<ProductVariant> findByItemIdAndIsDefaultTrue(Long itemId);

    /**
     * Find variant by SKU
     */
    Optional<ProductVariant> findBySku(String sku);

    /**
     * Check if SKU exists
     */
    boolean existsBySku(String sku);

    /**
     * Find available variants for an item
     */
    @Query("SELECT v FROM ProductVariant v WHERE v.item.id = :itemId AND v.isAvailable = true ORDER BY v.position ASC")
    List<ProductVariant> findAvailableVariantsByItemId(@Param("itemId") Long itemId);

    /**
     * Find variants with low stock
     */
    @Query("SELECT v FROM ProductVariant v WHERE v.item.id = :itemId AND v.trackInventory = true AND v.stock <= v.lowStockThreshold AND v.stock > 0")
    List<ProductVariant> findLowStockVariants(@Param("itemId") Long itemId);

    /**
     * Find out of stock variants
     */
    @Query("SELECT v FROM ProductVariant v WHERE v.item.id = :itemId AND v.trackInventory = true AND v.stock = 0 AND v.allowBackorders = false")
    List<ProductVariant> findOutOfStockVariants(@Param("itemId") Long itemId);

    /**
     * Count variants for an item
     */
    long countByItemId(Long itemId);

    /**
     * Delete all variants for an item
     */
    void deleteByItemId(Long itemId);

    /**
     * Find variants by item ID and availability
     */
    List<ProductVariant> findByItemIdAndIsAvailable(Long itemId, Boolean isAvailable);
}