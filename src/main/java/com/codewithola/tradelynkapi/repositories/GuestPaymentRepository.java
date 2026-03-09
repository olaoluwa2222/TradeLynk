package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.GuestPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuestPaymentRepository extends JpaRepository<GuestPayment, Long> {

    Optional<GuestPayment> findByPaystackReference(String paystackReference);

    boolean existsByPaystackReference(String paystackReference);
}

