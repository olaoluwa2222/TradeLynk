package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Find all orders for a buyer (paginated)
     * Use JOIN FETCH to avoid N+1 queries
     */
    @Query("SELECT o FROM Order o " +
            "JOIN FETCH o.item i " +
            "JOIN FETCH o.seller s " +
            "JOIN FETCH o.payment p " +
            "WHERE o.buyer.id = :buyerId " +
            "ORDER BY o.createdAt DESC")
    Page<Order> findByBuyerId(@Param("buyerId") Long buyerId, Pageable pageable);

    /**
     * Find all orders for a seller (paginated)
     * Use JOIN FETCH to avoid N+1 queries
     */
    @Query("SELECT o FROM Order o " +
            "JOIN FETCH o.item i " +
            "JOIN FETCH o.buyer b " +
            "JOIN FETCH o.payment p " +
            "WHERE o.seller.id = :sellerId " +
            "ORDER BY o.createdAt DESC")
    Page<Order> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    /**
     * Find orders by status
     */
    List<Order> findByStatus(Order.OrderStatus status);

    /**
     * Find pending orders older than a specific date
     * Used for auto-completion job
     */
    @Query("SELECT o FROM Order o " +
            "WHERE o.status = :status " +
            "AND o.createdAt < :date " +
            "ORDER BY o.createdAt ASC")
    List<Order> findByCreatedAtBeforeAndStatus(
            @Param("date") LocalDateTime date,
            @Param("status") Order.OrderStatus status
    );

    /**
     * Find order by ID with all relationships fetched
     * Avoids N+1 queries when fetching single order
     */
    @Query("SELECT o FROM Order o " +
            "JOIN FETCH o.item i " +
            "JOIN FETCH o.buyer b " +
            "JOIN FETCH o.seller s " +
            "JOIN FETCH o.payment p " +
            "WHERE o.id = :orderId")
    Optional<Order> findByIdWithDetails(@Param("orderId") Long orderId);

    /**
     * Find order by payment ID
     * Useful when creating order after successful payment
     */
    Optional<Order> findByPaymentId(Long paymentId);

    /**
     * Count orders by buyer
     */
    long countByBuyerId(Long buyerId);

    /**
     * Count orders by seller
     */
    long countBySellerId(Long sellerId);

    /**
     * Count orders by status
     */
    long countByStatus(Order.OrderStatus status);
}