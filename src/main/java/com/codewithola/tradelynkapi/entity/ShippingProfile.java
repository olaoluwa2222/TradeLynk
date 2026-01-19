package com.codewithola.tradelynkapi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ShippingProfile Entity - Defines shipping methods and costs for products
 * Sellers can choose different shipping strategies:
 * - Free shipping
 * - Flat rate (same price everywhere)
 * - Weight-based (calculated by product weight)
 * - Location-based (different rates per state/city)
 * - Buyer pays on delivery (no upfront shipping cost)
 */
@Entity
@Table(name = "shipping_profiles", indexes = {
        @Index(name = "idx_seller_id", columnList = "seller_id"),
        @Index(name = "idx_is_default", columnList = "is_default")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Seller who owns this shipping profile
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private User seller;

    /**
     * Profile name
     * Example: "Standard Shipping", "Express Delivery", "Free Shipping"
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Shipping method type
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShippingMethod shippingMethod;

    /**
     * Flat rate cost (in kobo) - used for FLAT_RATE method
     */
    @Column
    private Long flatRateCost;

    /**
     * Cost per kg (in kobo) - used for WEIGHT_BASED method
     * Example: ₦500 per kg
     */
    @Column
    private Long costPerKg;

    /**
     * Free shipping threshold (in kobo)
     * Example: Free shipping on orders above ₦10,000
     */
    @Column
    private Long freeShippingThreshold;

    /**
     * Estimated delivery time in days (minimum)
     */
    @Column
    private Integer minDeliveryDays;

    /**
     * Estimated delivery time in days (maximum)
     */
    @Column
    private Integer maxDeliveryDays;

    /**
     * Is this the default shipping profile for the seller?
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    /**
     * Is this shipping profile active?
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Additional notes/instructions
     */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /**
     * Location-based rates as JSON string
     * Example: {"Lagos": 1000, "Abuja": 1500, "Port Harcourt": 1200}
     * Prices in kobo
     */
    @Column(columnDefinition = "TEXT")
    private String locationRates; // JSON string

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ============================================
    // ENUM: Shipping Methods
    // ============================================

    public enum ShippingMethod {
        FREE_SHIPPING("Free Shipping"),
        FLAT_RATE("Flat Rate"),
        WEIGHT_BASED("Weight-Based"),
        LOCATION_BASED("Location-Based"),
        PAY_ON_DELIVERY("Pay on Delivery"),
        PICKUP_ONLY("Pickup Only");

        private final String displayName;

        ShippingMethod(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Calculate shipping cost based on method
     */
    public Long calculateShippingCost(Integer weightInGrams, Long orderTotal, String location) {
        switch (this.shippingMethod) {
            case FREE_SHIPPING:
                return 0L;

            case FLAT_RATE:
                // Check if order qualifies for free shipping threshold
                if (freeShippingThreshold != null && orderTotal >= freeShippingThreshold) {
                    return 0L;
                }
                return flatRateCost != null ? flatRateCost : 0L;

            case WEIGHT_BASED:
                if (weightInGrams == null || costPerKg == null) {
                    return flatRateCost != null ? flatRateCost : 0L;
                }
                double weightInKg = weightInGrams / 1000.0;
                long cost = (long) (weightInKg * costPerKg);

                // Check free shipping threshold
                if (freeShippingThreshold != null && orderTotal >= freeShippingThreshold) {
                    return 0L;
                }
                return cost;

            case LOCATION_BASED:
                // Would need to parse locationRates JSON
                // For now, fallback to flat rate
                return flatRateCost != null ? flatRateCost : 0L;

            case PAY_ON_DELIVERY:
            case PICKUP_ONLY:
                return 0L;

            default:
                return 0L;
        }
    }

    /**
     * Get estimated delivery range as string
     */
    public String getDeliveryEstimate() {
        if (minDeliveryDays == null && maxDeliveryDays == null) {
            return "Delivery time not specified";
        }

        if (minDeliveryDays != null && maxDeliveryDays != null) {
            if (minDeliveryDays.equals(maxDeliveryDays)) {
                return minDeliveryDays + " days";
            }
            return minDeliveryDays + "-" + maxDeliveryDays + " days";
        }

        if (minDeliveryDays != null) {
            return minDeliveryDays + "+ days";
        }

        return "Up to " + maxDeliveryDays + " days";
    }

    /**
     * Check if shipping is free for given order total
     */
    public boolean isFreeShipping(Long orderTotal) {
        if (shippingMethod == ShippingMethod.FREE_SHIPPING) {
            return true;
        }

        if (freeShippingThreshold != null && orderTotal >= freeShippingThreshold) {
            return true;
        }

        return false;
    }
}