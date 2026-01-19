package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.VariantOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VariantOptionRepository extends JpaRepository<VariantOption, Long> {

    /**
     * Find all system templates
     */
    List<VariantOption> findByIsSystemTemplateTrue();

    /**
     * Find system templates by category
     */
    List<VariantOption> findByIsSystemTemplateTrueAndCategory(String category);

    /**
     * Find seller's custom variant options
     */
    List<VariantOption> findBySellerIdOrderByDisplayOrderAsc(Long sellerId);

    /**
     * Find all variant options available to a seller (system + their own)
     */
    @Query("SELECT v FROM VariantOption v WHERE v.isSystemTemplate = true OR v.seller.id = :sellerId ORDER BY v.displayOrder ASC")
    List<VariantOption> findAvailableVariantOptions(@Param("sellerId") Long sellerId);

    /**
     * Find variant option by seller and option name
     */
    Optional<VariantOption> findBySellerIdAndOptionName(Long sellerId, String optionName);

    /**
     * Find system template by option name
     */
    Optional<VariantOption> findByIsSystemTemplateTrueAndOptionName(String optionName);
}