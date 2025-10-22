package com.codewithola.tradelynkapi.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Error Response DTO
 * Returned for error cases with detailed information
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ErrorResponse {

    /**
     * HTTP status code
     */
    private Integer status;

    /**
     * Error type/title
     */
    private String error;

    /**
     * Detailed error message
     */
    private String message;

    /**
     * Request path where error occurred
     */
    private String path;

    /**
     * Timestamp of error
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Additional error details (optional)
     */
    private Object details;
}