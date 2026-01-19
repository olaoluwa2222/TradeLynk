package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    /**
     * Find all images for an item, ordered by position
     */
    List<ProductImage> findByItemIdOrderByPositionAsc(Long itemId);

    /**
     * Find primary image for an item
     */
    Optional<ProductImage> findByItemIdAndIsPrimaryTrue(Long itemId);

    /**
     * Count images for an item
     */
    long countByItemId(Long itemId);

    /**
     * Delete all images for an item
     */
    void deleteByItemId(Long itemId);

    /**
     * Find image by Cloudinary public ID
     */
    Optional<ProductImage> findByCloudinaryPublicId(String cloudinaryPublicId);

    /**
     * Get maximum position for an item's images
     */
    @Query("SELECT COALESCE(MAX(p.position), -1) FROM ProductImage p WHERE p.item.id = :itemId")
    Integer getMaxPosition(Long itemId);
}