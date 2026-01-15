package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.Feedback;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Don't include null fields in JSON
public class FeedbackDTO {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Feedback.FeedbackType type;
    private String title;
    private String content;
    private Integer rating;
    private List<String> imageUrls;
    private String contactEmail;
    private String contactWhatsApp;
    private String pageUrl;
    private String userAgent;
    private String adminResponse;
    private LocalDateTime respondedAt;
    private Feedback.FeedbackStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isAnonymous;

    // ✅ Convert entity to DTO
    public static FeedbackDTO fromEntity(Feedback feedback) {
        List<String> imageUrls = null;
        if (feedback.getImageUrls() != null && !feedback.getImageUrls().isEmpty()) {
            try {
                // Parse JSON array string to List
                imageUrls = List.of(feedback.getImageUrls()
                        .replace("[", "")
                        .replace("]", "")
                        .replace("\"", "")
                        .split(","));
            } catch (Exception e) {
                // If parsing fails, set to null
                imageUrls = null;
            }
        }

        return FeedbackDTO.builder()
                .id(feedback.getId())
                .userId(feedback.getUser() != null ? feedback.getUser().getId() : null)
                .userName(feedback.getUser() != null ? feedback.getUser().getName() : "Anonymous")
                .userEmail(feedback.getUser() != null ? feedback.getUser().getEmail() : feedback.getContactEmail())
                .type(feedback.getType())
                .title(feedback.getTitle())
                .content(feedback.getContent())
                .rating(feedback.getRating())
                .imageUrls(imageUrls)
                .contactEmail(feedback.getContactEmail())
                .contactWhatsApp(feedback.getContactWhatsApp())
                .pageUrl(feedback.getPageUrl())
                .userAgent(feedback.getUserAgent())
                .adminResponse(feedback.getAdminResponse())
                .respondedAt(feedback.getRespondedAt())
                .status(feedback.getStatus())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .isAnonymous(feedback.isAnonymous())
                .build();
    }
}