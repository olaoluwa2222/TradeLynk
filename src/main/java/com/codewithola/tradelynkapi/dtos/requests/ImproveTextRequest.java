package com.codewithola.tradelynkapi.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImproveTextRequest {

    @NotBlank(message = "Text is required")
    @Size(min = 10, max = 500, message = "Text must be between 10 and 500 characters")
    private String text;

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "^(bio|tagline)$", message = "Type must be either 'bio' or 'tagline'")
    private String type;
}