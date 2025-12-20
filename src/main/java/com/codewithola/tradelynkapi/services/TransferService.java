package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.config.PaystackConfig;
import com.codewithola.tradelynkapi.dtos.response.TransferDTO;
import com.codewithola.tradelynkapi.entity.*;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * TransferService handles seller payouts via Paystack Transfer API
 * This service releases escrow funds to sellers after delivery confirmation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransferService {

    private final TransferRepository transferRepository;
    private final OrderRepository orderRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;
    private final PaystackConfig paystackConfig;
    private final RestTemplate restTemplate;
    private final NotificationService notificationService;

    private static final Double PLATFORM_FEE_PERCENTAGE = 3.0; // 3% platform fee

    /**
     * Initiate transfer to seller after delivery confirmation
     * This releases money from escrow to seller's bank account
     */
    @Transactional
    public TransferDTO initiateTransfer(Long orderId) {
        log.info("Initiating transfer for order: {}", orderId);

        // 1. Fetch order with details
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // 2. Validate order status
        if (!order.isDelivered()) {
            throw new BadRequestException("Can only transfer funds for delivered orders");
        }

        // 3. Check if transfer already exists
        if (transferRepository.existsByOrderId(orderId)) {
            throw new BadRequestException("Transfer already exists for this order");
        }

        // 4. Fetch seller and seller profile
        User seller = order.getSeller();
        SellerProfile sellerProfile = sellerProfileRepository.findByUserId(seller.getId())
                .orElseThrow(() -> new NotFoundException("Seller profile not found"));

        // 5. Validate seller has bank details
        if (sellerProfile.getAccountNumber() == null || sellerProfile.getBankName() == null) {
            throw new BadRequestException("Seller bank details not configured");
        }

        // 6. Calculate amounts (convert from Naira to kobo for Paystack)
        Long orderAmountInKobo = order.getAmount() * 100; // Convert Naira to kobo
        Long platformFeeInKobo = Transfer.calculatePlatformFee(orderAmountInKobo);
        Long sellerPayoutInKobo = orderAmountInKobo - platformFeeInKobo;

        log.info("Transfer calculation - Order: ₦{} ({} kobo), Fee: {} kobo, Payout: {} kobo",
                order.getAmount(), orderAmountInKobo, platformFeeInKobo, sellerPayoutInKobo);

        // 7. Create transfer record (PENDING status)
        Transfer transfer = Transfer.builder()
                .seller(seller)
                .order(order)
                .amount(sellerPayoutInKobo)
                .originalAmount(orderAmountInKobo)
                .platformFee(platformFeeInKobo)
                .status(Transfer.TransferStatus.PENDING)
                .build();

        Transfer savedTransfer = transferRepository.save(transfer);

        // 8. Call Paystack Transfer API
        try {
            String transferCode = callPaystackTransferAPI(
                    sellerProfile.getAccountNumber(),
                    sellerProfile.getBankName(),
                    sellerPayoutInKobo,
                    seller.getName(),
                    "Payout for order #" + orderId
            );

            // 9. Mark transfer as successful
            savedTransfer.markAsSuccess(transferCode);
            transferRepository.save(savedTransfer);

            // 10. Update order status to COMPLETED
            order.markAsCompleted();
            orderRepository.save(order);

            log.info("✅ Transfer successful! Code: {}, Amount: {} kobo", transferCode, sellerPayoutInKobo);

            // 11. Notify seller about payout
            notificationService.sendPayoutNotification(
                    seller.getId(),
                    order.getAmount(),
                    order.getItem().getTitle()
            );

        } catch (Exception e) {
            log.error("❌ Transfer failed for order {}", orderId, e);
            savedTransfer.markAsFailed(e.getMessage());
            transferRepository.save(savedTransfer);
            throw new RuntimeException("Failed to transfer funds: " + e.getMessage());
        }

        return TransferDTO.fromEntity(savedTransfer);
    }

    /**
     * Call Paystack Transfer API
     * Transfers money directly to seller's bank account
     */
    private String callPaystackTransferAPI(String accountNumber, String bankName,
                                           Long amountInKobo, String sellerName, String reason) {
        log.info("Calling Paystack Transfer API - Account: {}, Bank: {}, Amount: {} kobo",
                accountNumber, bankName, amountInKobo);

        try {
            // 1. Get bank code from bank name
            String bankCode = getBankCode(bankName);

            // 2. Create or get recipient code
            String recipientCode = createTransferRecipient(accountNumber, bankCode, sellerName);

            // 3. Initiate transfer
            Map<String, Object> transferRequest = new HashMap<>();
            transferRequest.put("source", "balance");
            transferRequest.put("amount", amountInKobo);
            transferRequest.put("recipient", recipientCode);
            transferRequest.put("reason", reason);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(transferRequest, headers);

            String url = paystackConfig.getBaseUrl() + "/transfer";
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getBody() != null && Boolean.TRUE.equals(response.getBody().get("status"))) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                String transferCode = (String) data.get("transfer_code");
                log.info("✅ Paystack transfer initiated: {}", transferCode);
                return transferCode;
            } else {
                throw new RuntimeException("Paystack transfer failed: " +
                        (response.getBody() != null ? response.getBody().get("message") : "Unknown error"));
            }

        } catch (HttpClientErrorException e) {
            log.error("Paystack API error: {}", e.getResponseBodyAsString(), e);
            throw new RuntimeException("Failed to initiate transfer: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error initiating transfer", e);
            throw new RuntimeException("Failed to initiate transfer: " + e.getMessage());
        }
    }

    /**
     * Create Paystack transfer recipient
     */
    private String createTransferRecipient(String accountNumber, String bankCode, String name) {
        log.info("Creating Paystack transfer recipient: {} - {}", accountNumber, bankCode);

        try {
            Map<String, Object> recipientRequest = new HashMap<>();
            recipientRequest.put("type", "nuban");
            recipientRequest.put("name", name);
            recipientRequest.put("account_number", accountNumber);
            recipientRequest.put("bank_code", bankCode);
            recipientRequest.put("currency", "NGN");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", paystackConfig.getAuthorizationHeader());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(recipientRequest, headers);

            String url = paystackConfig.getBaseUrl() + "/transferrecipient";
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getBody() != null && Boolean.TRUE.equals(response.getBody().get("status"))) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                String recipientCode = (String) data.get("recipient_code");
                log.info("✅ Recipient created: {}", recipientCode);
                return recipientCode;
            } else {
                throw new RuntimeException("Failed to create recipient: " +
                        (response.getBody() != null ? response.getBody().get("message") : "Unknown error"));
            }

        } catch (HttpClientErrorException e) {
            log.error("Paystack API error: {}", e.getResponseBodyAsString(), e);
            throw new RuntimeException("Failed to create recipient: " + e.getMessage());
        }
    }

    /**
     * Get bank code from bank name
     * Uses BankEnum from your existing code
     */
    private String getBankCode(String bankName) {
        try {
            return com.codewithola.tradelynkapi.Enum.BankEnum.fromName(bankName).getCode();
        } catch (Exception e) {
            log.error("Invalid bank name: {}", bankName);
            throw new BadRequestException("Invalid bank name: " + bankName);
        }
    }

    /**
     * Get transfer by ID
     */
    @Transactional(readOnly = true)
    public TransferDTO getTransferById(Long transferId) {
        Transfer transfer = transferRepository.findByIdWithDetails(transferId)
                .orElseThrow(() -> new NotFoundException("Transfer not found"));
        return TransferDTO.fromEntity(transfer);
    }

    /**
     * Get seller's transfer history
     */
    @Transactional(readOnly = true)
    public Page<TransferDTO> getSellerTransfers(Long sellerId, Pageable pageable) {
        Page<Transfer> transfers = transferRepository.findBySellerId(sellerId, pageable);
        return transfers.map(TransferDTO::fromEntity);
    }

    /**
     * Get transfer by order ID
     */
    @Transactional(readOnly = true)
    public TransferDTO getTransferByOrderId(Long orderId) {
        Transfer transfer = transferRepository.findByOrderId(orderId)
                .orElseThrow(() -> new NotFoundException("Transfer not found for this order"));
        return TransferDTO.fromEntity(transfer);
    }
}