package com.codewithola.tradelynkapi.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long itemId;

    @Column(nullable = false)
    private Long reporterId; // User who reported

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportReason reason;

    @Column(length = 500)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime reviewedAt;

    @Column
    private Long reviewedBy; // Admin user ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itemId", insertable = false, updatable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporterId", insertable = false, updatable = false)
    private User reporter;

    public enum ReportReason {
        INAPPROPRIATE,  // Offensive content
        ILLEGAL,        // Illegal items
        SCAM,          // Fraudulent listing
        DUPLICATE,     // Duplicate listing
        SPAM,          // Spam content
        OTHER          // Other reasons
    }

    public enum ReportStatus {
        PENDING,       // Awaiting review
        REVIEWED,      // Admin reviewed
        RESOLVED,      // Issue resolved
        REJECTED       // Report rejected
    }

    public void markAsReviewed(Long adminId, boolean approved) {
        this.reviewedAt = LocalDateTime.now();
        this.reviewedBy = adminId;

        if (approved) {
            this.status = ReportStatus.RESOLVED;
        } else {
            this.status = ReportStatus.REJECTED;
        }
    }
}
