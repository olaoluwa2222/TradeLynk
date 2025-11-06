package com.codewithola.tradelynkapi.dtos.response;

import com.codewithola.tradelynkapi.entity.Report;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {

    private Long id;
    private Long itemId;
    private String itemTitle;
    private Long reporterId;
    private String reporterName;
    private Report.ReportReason reason;
    private String comment;
    private Report.ReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
    private String reviewedByName;
}
