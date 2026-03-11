package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.requests.BecomeSellerRequest;
import com.codewithola.tradelynkapi.dtos.response.SellerProfileDTO;
import com.codewithola.tradelynkapi.dtos.response.SellerStatusResponse;
import com.codewithola.tradelynkapi.entity.SellerProfile;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.AlreadySellerException;
import com.codewithola.tradelynkapi.exception.BadRequestException;
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
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9-]{3,50}$");

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

        // 3. Validate username
        validateUsername(request.getUsername());

        // 4. Check if username is already taken
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username '" + request.getUsername() + "' is already taken");
        }

        // 5. Validate bank account details
        validateBankAccountDetails(request);

        // 6. Resolve bank code — prefer what the frontend sent; fall back to Paystack live list
        String bankCode = request.getBankCode();
        String bankName = request.getBankName();
        if (bankCode == null || bankCode.isBlank()) {
            bankCode = paystackService.resolveBankCode(bankName);
            if (bankCode == null) {
                throw new InvalidBankAccountException(
                        "Unrecognised bank: \"" + bankName + "\". Please select a bank from the list.");
            }
        }

        // 7. Set username on user
        user.setUsername(request.getUsername());
        userRepository.save(user);

        // 8. Create Seller Profile (FULL + CORRECT)
        SellerProfile sellerProfile = SellerProfile.builder()
                .user(user)

                // Business & bank details
                .businessName(request.getBusinessName() != null ? request.getBusinessName() : user.getName())
                .address(request.getAddress())
                .bankName(bankName)
                .bankCode(bankCode)
                .accountName(request.getAccountName())
                .accountNumber(request.getAccountNumber())

                // Storefront content
                .storeTagline(request.getStoreTagline())
                .bio(request.getBio())
                .logoUrl(request.getLogoUrl())
                .bannerImageUrl(request.getBannerImageUrl())

                // Contact & social
                .phoneNumber(request.getPhoneNumber())
                .whatsappNumber(request.getWhatsappNumber())
                .instagramHandle(request.getInstagramHandle())
                .twitterHandle(request.getTwitterHandle())
                .facebookHandle(request.getFacebookHandle())

                // Theme & customization (with defaults)
                .theme(request.getTheme() != null ? request.getTheme() : "modern-clean")
                .primaryColor(request.getPrimaryColor() != null ? request.getPrimaryColor() : "#000000")
                .secondaryColor(request.getSecondaryColor() != null ? request.getSecondaryColor() : "#FFFFFF")
                .layoutType("multi-page")

                // Review & verification
                .storeScreenshotUrl(request.getStoreScreenshotUrl())
                .verified(false)

                .build();

        sellerProfileRepository.save(sellerProfile);

        // 9. Create Paystack subaccount
        try {
            String subaccountCode = paystackService.createSubaccount(sellerProfile);
            sellerProfile.setPayStackSubaccountId(subaccountCode);
            sellerProfileRepository.save(sellerProfile);
            log.info("Paystack subaccount created: {}", subaccountCode);
        } catch (Exception e) {
            log.error("Failed to create Paystack subaccount", e);
        }

        // 10. Update user role
        updateUserRole(user);

        log.info("Seller account activated successfully for user ID: {}", userId);

        // 11. Return seller profile
        return sellerProfileService.getSellerProfile(userId);
    }

    private void validateUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Username is required");
        }

        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new BadRequestException(
                    "Username must be 3–50 characters, lowercase letters, numbers, and hyphens only");
        }

        if (username.equals("admin")
                || username.equals("api")
                || username.equals("www")
                || username.equals("tradelynk")) {
            throw new BadRequestException("Username '" + username + "' is reserved");
        }
    }

    private void validateBankAccountDetails(BecomeSellerRequest request) {
        if (!ACCOUNT_NUMBER_PATTERN.matcher(request.getAccountNumber()).matches()) {
            throw new InvalidBankAccountException("Account number must be exactly 10 digits.");
        }

        if (request.getAccountName() == null || request.getAccountName().trim().length() < 3) {
            throw new InvalidBankAccountException("Account name must be at least 3 characters long.");
        }
    }

    private void updateUserRole(User user) {
        if (user.getRole() == User.UserRole.BUYER) {
            user.setRole(User.UserRole.SELLER);
            userRepository.save(user);
        }
    }

    @Transactional(readOnly = true)
    public SellerStatusResponse getSellerStatus(Long userId) {
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

    @Transactional(readOnly = true)
    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }
}
