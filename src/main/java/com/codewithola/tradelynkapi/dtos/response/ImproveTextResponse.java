package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImproveTextResponse {
    private String originalText;
    private String improvedText;
    private String type;
    private int originalLength;
    private int improvedLength;
}