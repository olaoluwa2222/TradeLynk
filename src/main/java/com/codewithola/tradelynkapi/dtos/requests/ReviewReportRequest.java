package com.codewithola.tradelynkapi.dtos.requests;

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
public class ReviewReportRequest {

    @NotNull(message = "Approval decision is required")
    private Boolean approved; // true = approve report, false = reject report

    @Size(max = 500, message = "Admin comment must not exceed 500 characters")
    private String adminComment;
}
