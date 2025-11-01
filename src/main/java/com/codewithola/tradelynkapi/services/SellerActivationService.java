package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.Enum.BankEnum;
import com.codewithola.tradelynkapi.dtos.requests.BecomeSellerRequest;
import com.codewithola.tradelynkapi.dtos.response.SellerProfileDTO;
import com.codewithola.tradelynkapi.dtos.response.SellerStatusResponse;
import com.codewithola.tradelynkapi.entity.SellerProfile;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.AlreadySellerException;
import com.codewithola.tradelynkapi.exception.InvalidBankAccountException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.SellerProfileRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SellerActivationService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final SellerProfileService sellerProfileService;
    private final PaystackService paystackService;

    private static final Pattern ACCOUNT_NUMBER_PATTERN = Pattern.compile("^[0-9]{10}$");

    @Transactional
    public SellerProfileDTO activateSeller(Long userId, BecomeSellerRequest request) {
        log.info("Activating seller account for user ID: {}", userId);

        // 1. Fetch user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // 2. Check if user is already a seller
        if (sellerProfileRepository.existsByUserId(userId)) {
            throw new AlreadySellerException("You are already a seller. Cannot activate seller account again.");
        }

        // 3. Validate bank account details
        validateBankAccountDetails(request);

        // 4. Validate bank name exists in enum
        BankEnum bank;
        try {
            bank = BankEnum.fromName(request.getBankName());
        } catch (IllegalArgumentException e) {
            throw new InvalidBankAccountException("Invalid bank name: " + request.getBankName());
        }

        // 5. Create Seller Profile
        SellerProfile sellerProfile = SellerProfile.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .address(request.getAddress())
                .bankName(bank.getName())
                .accountName(request.getAccountName())
                .accountNumber(request.getAccountNumber())
                .verified(false)
                .build();

        sellerProfileRepository.save(sellerProfile);

        // 6. Create Paystack Subaccount (NEW)
        try {
            String subaccountCode = paystackService.createSubaccount(sellerProfile);
            sellerProfile.setPayStackSubaccountId(subaccountCode);
            sellerProfileRepository.save(sellerProfile);
            log.info("Paystack subaccount created: {}", subaccountCode);
        } catch (Exception e) {
            log.error("Failed to create Paystack subaccount", e);
            // Don't fail the entire activation, just log the error
            // Admin can manually create subaccount later
        }

        // 7. Update User role from BUYER to SELLER
        updateUserRole(user);

        log.info("Seller account activated successfully for user ID: {}", userId);

        // 8. Return seller profile DTO
        return sellerProfileService.getSellerProfile(userId);
    }

    private void validateBankAccountDetails(BecomeSellerRequest request) {
        // Validate account number format (10 digits)
        if (!ACCOUNT_NUMBER_PATTERN.matcher(request.getAccountNumber()).matches()) {
            throw new InvalidBankAccountException(
                    "Invalid account number. Must be exactly 10 digits.");
        }

        // Validate account name length
        if (request.getAccountName().trim().length() < 3) {
            throw new InvalidBankAccountException(
                    "Account name must be at least 3 characters long.");
        }

        // Account number should not start with 0 in some banks (optional check)
        // You can add more bank-specific validations here

        log.info("Bank account details validated successfully");
    }

    private void updateUserRole(User user) {
        User.UserRole currentRole = user.getRole();

        if (currentRole == User.UserRole.BUYER) {
            // Buyer becomes Seller (or you can use Role.BOTH if you have it)
            user.setRole(User.UserRole.SELLER);
        } else if (currentRole == User.UserRole.SELLER) {
            // Already a seller, shouldn't reach here due to earlier check
            throw new AlreadySellerException("User is already a seller");
        }

        userRepository.save(user);
        log.info("User role updated to: {}", user.getRole());
    }

    @Transactional(readOnly = true)
    public SellerStatusResponse getSellerStatus(Long userId) {
        log.info("Checking seller status for user ID: {}", userId);

        boolean isSeller = sellerProfileRepository.existsByUserId(userId);

        SellerProfileDTO profile = null;
        if (isSeller) {
            profile = sellerProfileService.getSellerProfile(userId);
        }

        return SellerStatusResponse.builder()
                .isSeller(isSeller)
                .sellerProfile(profile)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean isUserSeller(Long userId) {
        return sellerProfileRepository.existsByUserId(userId);
    }

}