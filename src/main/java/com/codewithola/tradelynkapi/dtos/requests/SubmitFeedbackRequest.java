package com.codewithola.tradelynkapi.dtos.requests;

import com.codewithola.tradelynkapi.entity.Feedback;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitFeedbackRequest {

    @NotNull(message = "Feedback type is required")
    private Feedback.FeedbackType type;

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 100, message = "Title must be between 5 and 100 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(min = 10, max = 2000, message = "Content must be between 10 and 2000 characters")
    private String content;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating; // Optional: 1-5 stars

    private List<String> imageUrls; // Optional: screenshots

    // ✅ For anonymous feedback
    @Email(message = "Email must be valid")
    private String contactEmail;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid WhatsApp number format")
    private String contactWhatsApp;

    // ✅ Context info
    private String pageUrl; // Where user submitted feedback from

    private String userAgent; // Browser/device info (auto-filled by frontend)
}