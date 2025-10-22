package com.codewithola.tradelynkapi.repositories;


import com.codewithola.tradelynkapi.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // Fetch all items for a seller
    List<Item> findBySellerId(Long sellerId);

    // Fetch all active items (homepage/feed)
    @Query("SELECT i FROM Item i WHERE i.status = 'ACTIVE' ORDER BY i.createdAt DESC")
    Page<Item> findByStatusOrderByCreatedAtDesc(Pageable pageable);

    // Search by keyword in title or description
    @Query("""
        SELECT i FROM Item i
        WHERE i.status = 'ACTIVE'
        AND (LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<Item> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // Fetch active items by category
    @Query("SELECT i FROM Item i WHERE i.status = 'ACTIVE' AND i.category = :category ORDER BY i.createdAt DESC")
    Page<Item> findActiveByCategoryOrderByCreatedAtDesc(@Param("category") Item.Category category, Pageable pageable);
}
