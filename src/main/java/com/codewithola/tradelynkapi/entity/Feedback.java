package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_type", columnList = "type"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ User who submitted feedback (nullable for anonymous feedback)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private FeedbackType type;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // ✅ For feature requests - user can rate priority
    @Column
    private Integer rating; // 1-5 stars (optional)

    // ✅ Store images if user uploads screenshots
    @Column(columnDefinition = "TEXT")
    private String imageUrls; // JSON array as string (e.g., ["url1", "url2"])

    // ✅ Contact info if anonymous feedback
    @Column(length = 100)
    private String contactEmail;

    @Column(length = 20)
    private String contactWhatsApp;

    // ✅ Page/context where feedback was submitted
    @Column(length = 500)
    private String pageUrl;

    @Column(length = 50)
    private String userAgent; // Browser/device info

    // ✅ Admin response
    @Column(columnDefinition = "TEXT")
    private String adminResponse;

    @Column
    private LocalDateTime respondedAt;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FeedbackStatus status = FeedbackStatus.NEW;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ✅ Enums
    public enum FeedbackType {
        FEATURE_REQUEST,  // User wants a new feature
        BUG_REPORT,       // Something is broken
        GENERAL_FEEDBACK, // General thoughts/suggestions
        TEMPLATE_REQUEST, // User wants specific storefront template
        COMPLAINT         // User is unhappy about something
    }

    public enum FeedbackStatus {
        NEW,              // Just submitted
        REVIEWED,         // Admin has seen it
        IN_PROGRESS,      // Being worked on
        COMPLETED,        // Issue resolved/feature added
        CLOSED            // Won't be implemented or resolved
    }

    // ✅ Helper methods
    public boolean isAnonymous() {
        return this.user == null;
    }

    public boolean hasResponse() {
        return this.adminResponse != null && !this.adminResponse.isEmpty();
    }

    public void markAsReviewed() {
        this.status = FeedbackStatus.REVIEWED;
    }

    public void markAsInProgress() {
        this.status = FeedbackStatus.IN_PROGRESS;
    }

    public void markAsCompleted() {
        this.status = FeedbackStatus.COMPLETED;
    }

    public void markAsClosed() {
        this.status = FeedbackStatus.CLOSED;
    }
}