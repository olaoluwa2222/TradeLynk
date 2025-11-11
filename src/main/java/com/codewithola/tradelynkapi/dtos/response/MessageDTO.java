package com.codewithola.tradelynkapi.dtos.response;

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

    private String messageId;
    private Long senderId;
    private String senderName;
    private String content;
    private List<String> imageUrls;
    private Long timestamp;
    private Boolean read;
}
