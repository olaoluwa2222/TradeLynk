package com.codewithola.tradelynkapi.repositories;


import com.codewithola.tradelynkapi.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findBySellerId(Long sellerId);

    Page<Item> findByStatus(Item.Status status, Pageable pageable);

    Page<Item> findByCategory(Item.Category category, Pageable pageable);

    Page<Item> findByPriceBetween(Long minPrice, Long maxPrice, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.status = 'ACTIVE' ORDER BY i.createdAt DESC")
    Page<Item> findByStatusOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.status = 'ACTIVE' AND " +
            "(LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Item> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    Optional<Item> findByIdAndSellerId(Long id, Long sellerId);

    @Query("SELECT i FROM Item i WHERE i.status = 'ACTIVE' AND i.category = :category ORDER BY i.createdAt DESC")
    Page<Item> findActiveByCategoryOrderByCreatedAtDesc(@Param("category") Item.Category category, Pageable pageable);

    boolean existsByIdAndSellerId(Long id, Long sellerId);

    Page<Item> findBySellerIdAndStatus(Long sellerId, Item.Status status, Pageable pageable);
}