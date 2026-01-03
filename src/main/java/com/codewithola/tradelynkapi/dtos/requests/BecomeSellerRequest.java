package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BecomeSellerRequest {

    // ============================================
    // REQUIRED FIELDS
    // ============================================

    /**
     * Username for public storefront URL
     * Example: "isaiah-olaoluwa" → tradelynk.com/sellers/isaiah-olaoluwa
     * Must be unique, 3-50 chars, lowercase letters, numbers, hyphens only
     */
    @NotBlank(message = "Username is required")
    @Pattern(regexp = "^[a-z0-9-]{3,50}$",
            message = "Username must be 3-50 characters, lowercase letters, numbers, and hyphens only")
    private String username;

    /**
     * Store tagline/slogan (max 100 chars)
     * Example: "Best Tech Deals on Campus"
     */
    @NotBlank(message = "Store tagline is required")
    @Size(max = 100, message = "Store tagline must not exceed 100 characters")
    private String storeTagline;

    /**
     * Seller bio/description (max 500 chars)
     */
    @NotBlank(message = "Bio is required")
    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    /**
     * Bank name (from BankEnum)
     */
    @NotBlank(message = "Bank name is required")
    private String bankName;

    /**
     * Account holder's name
     */
    @NotBlank(message = "Account name is required")
    @Size(min = 3, max = 100, message = "Account name must be between 3 and 100 characters")
    private String accountName;

    /**
     * Bank account number (10 digits)
     */
    @NotBlank(message = "Account number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Account number must be exactly 10 digits")
    private String accountNumber;

    // ============================================
    // OPTIONAL FIELDS (shown in form, not required)
    // ============================================

    /**
     * Business name (optional)
     */
    @Size(max = 100, message = "Business name must not exceed 100 characters")
    private String businessName;

    /**
     * Business address (optional)
     */
    @Size(max = 200, message = "Address must not exceed 200 characters")
    private String address;

    /**
     * Store logo URL (Cloudinary)
     * Optional, uploaded during signup
     */
    @Size(max = 500, message = "Logo URL too long")
    private String logoUrl;

    /**
     * Store banner image URL (Cloudinary)
     * Optional, uploaded during signup
     */
    @Size(max = 500, message = "Banner URL too long")
    private String bannerImageUrl;

    /**
     * Phone number (optional)
     */
    @Pattern(regexp = "^[0-9]{11}$|^$", message = "Phone number must be 11 digits")
    private String phoneNumber;

    /**
     * WhatsApp number (optional)
     */
    @Pattern(regexp = "^[0-9]{11}$|^$", message = "WhatsApp number must be 11 digits")
    private String whatsappNumber;

    /**
     * Instagram handle (optional, without @)
     */
    @Size(max = 50, message = "Instagram handle too long")
    private String instagramHandle;

    /**
     * Twitter handle (optional, without @)
     */
    @Size(max = 50, message = "Twitter handle too long")
    private String twitterHandle;

    /**
     * Store screenshot URL (for verification)
     * Optional, helps speed up manual verification
     */
    @Size(max = 500, message = "Screenshot URL too long")
    private String storeScreenshotUrl;

    // ============================================
// THEME & CUSTOMIZATION (OPTIONAL)
// ============================================

    /**
     * Selected theme (optional, defaults to modern-clean)
     */
    @Size(max = 50, message = "Theme name too long")
    private String theme;

    /**
     * Primary color (optional, defaults to #000000)
     */
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$|^$", message = "Invalid color format")
    private String primaryColor;

    /**
     * Secondary color (optional, defaults to #FFFFFF)
     */
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$|^$", message = "Invalid color format")
    private String secondaryColor;

    /**
     * Facebook handle (optional)
     */
    @Size(max = 100, message = "Facebook handle too long")
    private String facebookHandle;
}