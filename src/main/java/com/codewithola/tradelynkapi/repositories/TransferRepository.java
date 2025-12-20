package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.Transfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, Long> {

    /**
     * Find transfer by Paystack transfer code
     */
    Optional<Transfer> findByPaystackTransferCode(String transferCode);

    /**
     * Find transfer by order ID
     */
    Optional<Transfer> findByOrderId(Long orderId);

    /**
     * Find all transfers for a seller
     */
    @Query("SELECT t FROM Transfer t " +
            "JOIN FETCH t.order o " +
            "JOIN FETCH o.item i " +
            "WHERE t.seller.id = :sellerId " +
            "ORDER BY t.createdAt DESC")
    Page<Transfer> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    /**
     * Find transfers by status
     */
    @Query("SELECT t FROM Transfer t " +
            "JOIN FETCH t.seller s " +
            "JOIN FETCH t.order o " +
            "WHERE t.status = :status " +
            "ORDER BY t.createdAt DESC")
    Page<Transfer> findByStatus(@Param("status") Transfer.TransferStatus status, Pageable pageable);

    /**
     * Find transfer by ID with details
     */
    @Query("SELECT t FROM Transfer t " +
            "JOIN FETCH t.seller s " +
            "JOIN FETCH t.order o " +
            "JOIN FETCH o.item i " +
            "WHERE t.id = :transferId")
    Optional<Transfer> findByIdWithDetails(@Param("transferId") Long transferId);

    /**
     * Find all pending transfers (for retry job)
     */
    @Query("SELECT t FROM Transfer t " +
            "WHERE t.status = 'PENDING' " +
            "AND t.createdAt < :threshold " +
            "ORDER BY t.createdAt ASC")
    List<Transfer> findPendingTransfersOlderThan(@Param("threshold") java.time.LocalDateTime threshold);

    /**
     * Count transfers by seller
     */
    long countBySellerId(Long sellerId);

    /**
     * Count transfers by status
     */
    long countByStatus(Transfer.TransferStatus status);

    /**
     * Calculate total transferred amount to a seller
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transfer t " +
            "WHERE t.seller.id = :sellerId " +
            "AND t.status = 'SUCCESS'")
    Long sumSuccessfulTransfersBySellerId(@Param("sellerId") Long sellerId);

    /**
     * Calculate total platform fees earned
     */
    @Query("SELECT COALESCE(SUM(t.platformFee), 0) FROM Transfer t " +
            "WHERE t.status = 'SUCCESS'")
    Long sumTotalPlatformFees();

    /**
     * Check if order already has a transfer
     */
    boolean existsByOrderId(Long orderId);
}