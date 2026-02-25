package com.codewithola.tradelynkapi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "whatsapp_configs")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SellerWhatsAppConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false, unique = true)
    private User seller;

    @Column(name = "phone_number_id", nullable = false, unique = true, length = 50)
    private String phoneNumberId;

    @Column(name = "phone_number", nullable = false, unique = true, length = 20)
    private String phoneNumber;

    @Column(name = "access_token", nullable = false, columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "webhook_verify_token", nullable = false, length = 100)
    private String webhookVerifyToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING_SETUP;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;

    @Column(name = "total_conversations")
    @Builder.Default
    private Integer totalConversations = 0;

    @Column(name = "total_messages_sent")
    @Builder.Default
    private Integer totalMessagesSent = 0;

    @Column(name = "total_messages_received")
    @Builder.Default
    private Integer totalMessagesReceived = 0;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum Status {
        ACTIVE,
        SUSPENDED,
        PENDING_SETUP
    }

    public void incrementMessagesSent() {
        this.totalMessagesSent++;
        this.lastMessageAt = LocalDateTime.now();
    }

    public void incrementMessagesReceived() {
        this.totalMessagesReceived++;
        this.lastMessageAt = LocalDateTime.now();
    }

    public void incrementConversations() {
        this.totalConversations++;
    }
}
