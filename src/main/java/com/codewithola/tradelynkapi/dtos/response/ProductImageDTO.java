package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for product image
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageDTO {
    private Long id;
    private String imageUrl;
    private String thumbnailUrl;
    private String altText;
    private Integer position;
    private Boolean isPrimary;
    private Integer width;
    private Integer height;
    private LocalDateTime createdAt;

    // Helper methods for Cloudinary transformations
    public String getThumbnail() {
        return thumbnailUrl != null ? thumbnailUrl : imageUrl;
    }

    public String getMediumUrl() {
        if (imageUrl != null && imageUrl.contains("cloudinary.com")) {
            return imageUrl.replace("/upload/", "/upload/w_800,h_800,c_fill,q_80,f_auto/");
        }
        return imageUrl;
    }
}



