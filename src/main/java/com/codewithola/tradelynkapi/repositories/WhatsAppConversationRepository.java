package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.WhatsAppConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhatsAppConversationRepository extends JpaRepository<WhatsAppConversation, Long> {

    Optional<WhatsAppConversation> findBySellerIdAndCustomerPhone(Long sellerId, String customerPhone);

    List<WhatsAppConversation> findBySellerId(Long sellerId);

    List<WhatsAppConversation> findByCustomerPhone(String customerPhone);
}