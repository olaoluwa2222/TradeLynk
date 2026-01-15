package com.codewithola.tradelynkapi.dtos.requests;

import com.codewithola.tradelynkapi.entity.Feedback;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRespondToFeedbackRequest {

    @NotBlank(message = "Response is required")
    @Size(min = 10, max = 2000, message = "Response must be between 10 and 2000 characters")
    private String response;

    @NotNull(message = "Status is required")
    private Feedback.FeedbackStatus status;
}