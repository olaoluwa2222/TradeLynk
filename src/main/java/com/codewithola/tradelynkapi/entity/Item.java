package com.codewithola.tradelynkapi.entity;



import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Proper relationship with User entity (seller)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    @JsonIgnore
    private User seller;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    // ✅ Use BigDecimal for money in real projects (can be Long for simplicity)
    @Column(nullable = false)
    private Long price; // Stored in kobo for precision

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Condition condition;

    @Column(nullable = false)
    private Integer quantity;

    @Column
    private LocalDate expiryDate;

    @Column(columnDefinition = "TEXT")
    private String imageUrls; // JSON array as a string (could later be converted to a List)

    @Builder.Default
    @Column(nullable = false)
    private Integer likeCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer viewCount = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ✅ Enum Definitions
    public enum Category {
        BOOKS,
        CLOTHING,
        ELECTRONICS,
        FOOD,
        LIGHT,
        TRANSPORTATION
    }

    public enum Condition {
        NEW,
        LIKE_NEW,
        USED,
        REFURBISHED
    }

    public enum Status {
        ACTIVE,
        SOLD,
        HIDDEN
    }

    // ✅ Utility methods
    public void incrementViewCount() {
        this.viewCount++;
    }

    public void incrementLikeCount() {
        this.likeCount++;
    }

    public void decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }
}
