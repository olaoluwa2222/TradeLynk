package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileDTO {

    private Long userId;
    private String name;
    private String email;
    private String businessName;
    private String profilePictureUrl;
    private String address;
    private LocalDateTime memberSince;
    private Integer totalItems;
    private Integer totalLikes;
    private Integer totalSales;
    private Boolean isVerified;
}
