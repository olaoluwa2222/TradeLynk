package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {

    /**
     * Find collection by slug
     */
    Optional<Collection> findBySlug(String slug);

    /**
     * Find all collections for a seller
     */
    List<Collection> findBySellerIdOrderByDisplayOrderAsc(Long sellerId);

    /**
     * Find active collections for a seller
     */
    List<Collection> findBySellerIdAndIsActiveTrueOrderByDisplayOrderAsc(Long sellerId);

    /**
     * Find featured collections for a seller
     */
    @Query("SELECT c FROM Collection c WHERE c.seller.id = :sellerId AND c.isFeatured = true AND c.isActive = true ORDER BY c.displayOrder ASC")
    List<Collection> findFeaturedCollectionsBySeller(@Param("sellerId") Long sellerId);

    /**
     * Check if slug exists
     */
    boolean existsBySlug(String slug);

    /**
     * Find collections containing a specific item
     */
    @Query("SELECT c FROM Collection c JOIN c.items i WHERE i.id = :itemId")
    List<Collection> findCollectionsByItemId(@Param("itemId") Long itemId);

    /**
     * Count items in a collection
     */
    @Query("SELECT COUNT(i) FROM Collection c JOIN c.items i WHERE c.id = :collectionId")
    long countItemsInCollection(@Param("collectionId") Long collectionId);

    /**
     * Find collection by seller and name (for duplicate check)
     */
    Optional<Collection> findBySellerIdAndName(Long sellerId, String name);
}