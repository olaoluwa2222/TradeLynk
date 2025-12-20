package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.Dispute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    /**
     * Find dispute by order ID
     */
    Optional<Dispute> findByOrderId(Long orderId);

    /**
     * Find all disputes raised by a user
     */
    @Query("SELECT d FROM Dispute d " +
            "JOIN FETCH d.order o " +
            "JOIN FETCH o.item i " +
            "WHERE d.raisedBy.id = :userId " +
            "ORDER BY d.createdAt DESC")
    Page<Dispute> findByRaisedById(@Param("userId") Long userId, Pageable pageable);

    /**
     * Find all disputes for a seller's orders
     */
    @Query("SELECT d FROM Dispute d " +
            "JOIN FETCH d.order o " +
            "JOIN FETCH o.item i " +
            "WHERE o.seller.id = :sellerId " +
            "ORDER BY d.createdAt DESC")
    Page<Dispute> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    /**
     * Find all disputes by status (for admin)
     */
    @Query("SELECT d FROM Dispute d " +
            "JOIN FETCH d.order o " +
            "JOIN FETCH o.item i " +
            "JOIN FETCH d.raisedBy rb " +
            "WHERE d.status = :status " +
            "ORDER BY d.createdAt DESC")
    Page<Dispute> findByStatus(@Param("status") Dispute.DisputeStatus status, Pageable pageable);

    /**
     * Find all disputes (for admin dashboard)
     */
    @Query("SELECT d FROM Dispute d " +
            "JOIN FETCH d.order o " +
            "JOIN FETCH o.item i " +
            "JOIN FETCH d.raisedBy rb " +
            "ORDER BY d.createdAt DESC")
    Page<Dispute> findAllWithDetails(Pageable pageable);

    /**
     * Find dispute by ID with all details (avoid N+1)
     */
    @Query("SELECT d FROM Dispute d " +
            "JOIN FETCH d.order o " +
            "JOIN FETCH o.item i " +
            "JOIN FETCH o.buyer b " +
            "JOIN FETCH o.seller s " +
            "JOIN FETCH d.raisedBy rb " +
            "LEFT JOIN FETCH d.resolvedBy res " +
            "WHERE d.id = :disputeId")
    Optional<Dispute> findByIdWithDetails(@Param("disputeId") Long disputeId);

    /**
     * Count disputes by status
     */
    long countByStatus(Dispute.DisputeStatus status);

    /**
     * Count open disputes for a seller
     */
    @Query("SELECT COUNT(d) FROM Dispute d " +
            "WHERE d.order.seller.id = :sellerId " +
            "AND d.status = 'OPEN'")
    long countOpenDisputesForSeller(@Param("sellerId") Long sellerId);

    /**
     * Check if order already has a dispute
     */
    boolean existsByOrderId(Long orderId);

    /**
     * Find all open disputes older than specified hours (for auto-escalation)
     */
    @Query("SELECT d FROM Dispute d " +
            "WHERE d.status = 'OPEN' " +
            "AND d.createdAt < :threshold " +
            "ORDER BY d.createdAt ASC")
    List<Dispute> findOpenDisputesOlderThan(@Param("threshold") java.time.LocalDateTime threshold);
}