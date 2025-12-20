package com.codewithola.tradelynkapi.dtos.requests;

import com.codewithola.tradelynkapi.entity.Dispute;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for resolving a dispute (admin only)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResolveRequest {

    @NotNull(message = "Resolution is required")
    private Dispute.DisputeResolution resolution;

    @Size(max = 1000, message = "Admin notes cannot exceed 1000 characters")
    private String adminNotes;
}