package com.codewithola.tradelynkapi.dtos.requests;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotBlank(message = "Chat ID is required")
    private String chatId;

    @NotBlank(message = "Message content is required")
    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String content;

    private List<String> imageUrls; // Optional image attachments
}
