package com.codewithola.tradelynkapi.repositories;


import com.codewithola.tradelynkapi.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaystackReference(String reference);

    List<Payment> findByBuyerId(Long buyerId);

    List<Payment> findBySellerId(Long sellerId);

    Page<Payment> findByBuyerId(Long buyerId, Pageable pageable);

    Page<Payment> findBySellerId(Long sellerId, Pageable pageable);

    List<Payment> findByItemId(Long itemId);

    List<Payment> findByStatus(Payment.PaymentStatus status);

    boolean existsByPaystackReference(String reference);
}
