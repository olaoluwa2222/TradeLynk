package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.SellerProfile;
import com.codewithola.tradelynkapi.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * StorefrontResponse DTO
 * Public-facing response for seller storefront page
 * Combines user data + seller profile data + stats
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorefrontResponse {

    // ============================================
    // BASIC INFO
    // ============================================
    private Long userId;
    private String username;
    private String name;
    private String email; // Consider removing for privacy
    private String profilePictureUrl;

    // ============================================
    // STOREFRONT INFO
    // ============================================
    private String businessName;
    private String storeTagline;
    private String bio;
    private String logoUrl;
    private String bannerImageUrl;
    private String address;

    // ============================================
    // CONTACT INFO
    // ============================================
    private String phoneNumber;
    private String whatsappNumber;
    private String instagramHandle;
    private String twitterHandle;

    // ============================================
    // STATS
    // ============================================
    private Integer totalItems;
    private Integer totalLikes;
    private Integer totalSales;
    private LocalDateTime memberSince;

    // ============================================
    // VERIFICATION
    // ============================================
    private Boolean isVerified;

    /**
     * Factory method to create StorefrontResponse from User and SellerProfile
     */
    public static StorefrontResponse fromEntities(
            User user,
            SellerProfile sellerProfile,
            Integer totalItems,
            Integer totalLikes,
            Integer totalSales
    ) {
        return StorefrontResponse.builder()
                // Basic info
                .userId(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .profilePictureUrl(user.getProfilePictureUrl())

                // Storefront info
                .businessName(sellerProfile != null ? sellerProfile.getBusinessName() : null)
                .storeTagline(sellerProfile != null ? sellerProfile.getStoreTagline() : null)
                .bio(sellerProfile != null ? sellerProfile.getBio() : null)
                .logoUrl(sellerProfile != null ? sellerProfile.getLogoUrl() : null)
                .bannerImageUrl(sellerProfile != null ? sellerProfile.getBannerImageUrl() : null)
                .address(sellerProfile != null ? sellerProfile.getAddress() : null)

                // Contact info
                .phoneNumber(sellerProfile != null ? sellerProfile.getPhoneNumber() : null)
                .whatsappNumber(sellerProfile != null ? sellerProfile.getWhatsappNumber() : null)
                .instagramHandle(sellerProfile != null ? sellerProfile.getInstagramHandle() : null)
                .twitterHandle(sellerProfile != null ? sellerProfile.getTwitterHandle() : null)

                // Stats
                .totalItems(totalItems)
                .totalLikes(totalLikes)
                .totalSales(totalSales)
                .memberSince(user.getCreatedAt())

                // Verification
                .isVerified(sellerProfile != null && sellerProfile.getVerified())
                .build();
    }
}