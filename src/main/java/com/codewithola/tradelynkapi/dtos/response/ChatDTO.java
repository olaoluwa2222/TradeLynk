package com.codewithola.tradelynkapi.dtos.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatDTO {

    private String chatId;
    private Long itemId;
    private String itemTitle;
    private String itemImageUrl;
    private Long buyerId;
    private String buyerName;
    private Long sellerId;
    private String sellerName;
    private Long createdAt;
    private Long lastMessageAt;
    private String lastMessage;
    private Integer unreadCount;
}
