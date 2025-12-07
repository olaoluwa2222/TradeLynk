package com.codewithola.tradelynkapi.dtos.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {

    @JsonProperty("id") // ✅ Map messageId to "id" in JSON response
    private String messageId;

    private Long senderId;
    private String senderName;
    private String content;

    @JsonProperty("imageUrls")
    private List<String> imageUrls;

    private Long timestamp;
    private Boolean read;

    @JsonProperty("readAt")
    private Long readAt; // ✅ Add this field
}