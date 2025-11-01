package com.codewithola.tradelynkapi.controller;


import com.codewithola.tradelynkapi.Enum.BankEnum;
import com.codewithola.tradelynkapi.dtos.requests.BecomeSellerRequest;
import com.codewithola.tradelynkapi.dtos.response.SellerProfileDTO;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.SellerActivationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sellers")
@RequiredArgsConstructor
@Slf4j
public class SellerController {

    private final SellerActivationService sellerActivationService;

    /**
     * POST /api/sellers/activate
     * Activate seller account (authenticated)
     */
    @PostMapping("/activate")
    public ResponseEntity<Map<String, Object>> activateSeller(
            @Valid @RequestBody BecomeSellerRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/sellers/activate - User: {} becoming a seller",
                userPrincipal.getEmail());

        SellerProfileDTO sellerProfile = sellerActivationService.activateSeller(
                userPrincipal.getId(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Seller account activated successfully");
        response.put("sellerId", sellerProfile.getUserId());
        response.put("data", sellerProfile);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/sellers/me/status
     * Check if current user is a seller (authenticated)
     */
    @GetMapping("/me/status")
    public ResponseEntity<Map<String, Object>> getSellerStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/sellers/me/status - User: {}", userPrincipal.getEmail());

        var status = sellerActivationService.getSellerStatus(userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isSeller", status.getIsSeller());
        response.put("sellerProfile", status.getSellerProfile());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sellers/banks
     * Get list of supported banks (public)
     */
    @GetMapping("/banks")
    public ResponseEntity<Map<String, Object>> getSupportedBanks() {
        log.info("GET /api/sellers/banks - Fetching supported banks");

        List<Map<String, String>> banks = Arrays.stream(BankEnum.values())
                .map(bank -> Map.of(
                        "code", bank.getCode(),
                        "name", bank.getName()
                ))
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", banks);
        response.put("count", banks.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sellers/validate-account
     * Validate bank account (for future Paystack integration)
     */
    @GetMapping("/validate-account")
    public ResponseEntity<Map<String, Object>> validateBankAccount(
            @RequestParam String accountNumber,
            @RequestParam String bankCode) {

        log.info("GET /api/sellers/validate-account - Validating account: {}", accountNumber);

        // TODO: Integrate with Paystack API to validate account
        // For now, return a placeholder response

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Account validation endpoint (Paystack integration pending)");
        response.put("accountNumber", accountNumber);
        response.put("bankCode", bankCode);

        return ResponseEntity.ok(response);
    }
}
