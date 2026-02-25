package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.SellerWhatsAppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerWhatsAppConfigRepository extends JpaRepository<SellerWhatsAppConfig, Long> {

    Optional<SellerWhatsAppConfig> findBySellerId(Long sellerId);

    Optional<SellerWhatsAppConfig> findByPhoneNumberId(String phoneNumberId);

    Optional<SellerWhatsAppConfig> findByPhoneNumber(String phoneNumber);

    boolean existsBySellerId(Long sellerId);
}