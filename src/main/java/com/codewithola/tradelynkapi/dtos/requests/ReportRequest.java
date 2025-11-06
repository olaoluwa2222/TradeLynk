package com.codewithola.tradelynkapi.dtos.requests;

import com.codewithola.tradelynkapi.entity.Report;
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
public class ReportRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotNull(message = "Report reason is required")
    private Report.ReportReason reason;

    @Size(max = 500, message = "Comment must not exceed 500 characters")
    private String comment;
}
