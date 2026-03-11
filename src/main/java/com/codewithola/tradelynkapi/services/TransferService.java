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
 * TransferService — manual seller payouts via Paystack Transfer API.
 * In the direct payment flow, Paystack settles funds to the seller at payment time.
 * This service is used for admin-initiated manual payouts only.
 * No platform commission — sellers receive 100% of the order amount.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransferService {

    private final TransferRepository transferRepository;
    private final OrderRepository orderRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PaystackConfig paystackConfig;
    private final RestTemplate restTemplate;
    private final NotificationService notificationService;
    private final PaystackService paystackService;

    /**
     * Initiate a transfer to the seller for a given order.
     * Seller receives 100% — no commission deducted.
     * Accepts orders in any active state: PAID, SHIPPED, DELIVERED, or COMPLETED.
     */
    @Transactional
    public TransferDTO initiateTransfer(Long orderId) {
        log.info("Initiating transfer for order: {}", orderId);

        // 1. Fetch order with details
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // 2. Validate order status — accept PAID, SHIPPED, DELIVERED, or COMPLETED
        if (!order.canBeCompleted() && !order.isCompleted()) {
            throw new BadRequestException(
                    "Can only transfer funds for PAID, SHIPPED, DELIVERED, or COMPLETED orders. Current status: "
                    + order.getStatus());
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

        // 6. Seller receives 100% — convert Naira to kobo for Paystack
        Long orderAmountInKobo = order.getAmount() * 100;
        Long platformFeeInKobo = 0L; // No platform commission
        Long sellerPayoutInKobo = orderAmountInKobo;

        log.info("Transfer: Order ₦{} ({} kobo) → Seller payout: {} kobo (100%, no commission)",
                order.getAmount(), orderAmountInKobo, sellerPayoutInKobo);

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
                    sellerProfile.getBankCode() != null ? sellerProfile.getBankCode() : sellerProfile.getBankName(),
                    sellerPayoutInKobo,
                    seller.getName(),
                    "Payout for order #" + orderId
            );

            // 9. Mark transfer as successful
            savedTransfer.markAsSuccess(transferCode);
            transferRepository.save(savedTransfer);

            // 10. Mark order as COMPLETED if not already
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
     * Call Paystack Transfer API — transfers money to seller's bank account.
     * bankNameOrCode may be a stored bank code (e.g. "058") or a bank name (e.g. "Guaranty Trust Bank").
     */
    @SuppressWarnings("unchecked")
    private String callPaystackTransferAPI(String accountNumber, String bankNameOrCode,
                                           Long amountInKobo, String sellerName, String reason) {
        log.info("Calling Paystack Transfer API - Account: {}, BankNameOrCode: {}, Amount: {} kobo",
                accountNumber, bankNameOrCode, amountInKobo);

        try {
            // If it looks like a numeric code (all digits or alphanumeric short code), use it directly;
            // otherwise resolve as a name.
            String bankCode;
            if (bankNameOrCode != null && bankNameOrCode.matches("^[0-9A-Za-z]{2,10}$")) {
                bankCode = bankNameOrCode; // already a code
            } else {
                bankCode = getBankCode(bankNameOrCode);
            }
            String recipientCode = createTransferRecipient(accountNumber, bankCode, sellerName);

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

            @SuppressWarnings("rawtypes")
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
     * Create a Paystack transfer recipient for the seller's bank account.
     */
    @SuppressWarnings("unchecked")
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

            @SuppressWarnings("rawtypes")
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

    private String getBankCode(String bankName) {
        try {
            String code = paystackService.resolveBankCode(bankName);
            if (code == null) {
                throw new BadRequestException("Invalid bank name: " + bankName);
            }
            return code;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Invalid bank name: {}", bankName);
            throw new BadRequestException("Invalid bank name: " + bankName);
        }
    }

    @Transactional(readOnly = true)
    public TransferDTO getTransferById(Long transferId) {
        Transfer transfer = transferRepository.findByIdWithDetails(transferId)
                .orElseThrow(() -> new NotFoundException("Transfer not found"));
        return TransferDTO.fromEntity(transfer);
    }

    @Transactional(readOnly = true)
    public Page<TransferDTO> getSellerTransfers(Long sellerId, Pageable pageable) {
        return transferRepository.findBySellerId(sellerId, pageable).map(TransferDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public TransferDTO getTransferByOrderId(Long orderId) {
        Transfer transfer = transferRepository.findByOrderId(orderId)
                .orElseThrow(() -> new NotFoundException("Transfer not found for this order"));
        return TransferDTO.fromEntity(transfer);
    }
}

