package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.ProductTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductTagRepository extends JpaRepository<ProductTag, Long> {

    /**
     * Find tag by normalized name
     */
    Optional<ProductTag> findByName(String name);

    /**
     * Find tags by name in list
     */
    List<ProductTag> findByNameIn(List<String> names);

    /**
     * Check if tag exists by name
     */
    boolean existsByName(String name);

    /**
     * Find most popular tags (by usage count)
     */
    @Query("SELECT t FROM ProductTag t ORDER BY t.usageCount DESC")
    List<ProductTag> findPopularTags();

    /**
     * Find tags for an item
     */
    @Query("SELECT t FROM ProductTag t JOIN t.items i WHERE i.id = :itemId")
    List<ProductTag> findTagsByItemId(@Param("itemId") Long itemId);

    /**
     * Search tags by name (autocomplete)
     */
    @Query("SELECT t FROM ProductTag t WHERE LOWER(t.name) LIKE LOWER(CONCAT(:query, '%')) OR LOWER(t.displayName) LIKE LOWER(CONCAT(:query, '%')) ORDER BY t.usageCount DESC")
    List<ProductTag> searchTags(@Param("query") String query);

    /**
     * Find unused tags (usage count = 0)
     */
    @Query("SELECT t FROM ProductTag t WHERE t.usageCount = 0")
    List<ProductTag> findUnusedTags();
}