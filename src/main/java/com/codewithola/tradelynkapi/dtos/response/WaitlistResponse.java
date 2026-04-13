package com.codewithola.tradelynkapi.dtos.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Waitlist Response DTO
 * Returns confirmation details after successful signup
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WaitlistResponse {

    /**
     * Unique identifier for this waitlist entry
     */
    private UUID id;

    /**
     * Confirmed email address (normalized to lowercase)
     */
    private String email;

    /**
     * Source of the signup
     */
    private String source;

    /**
     * Timestamp when user was added to waitlist
     */
    private OffsetDateTime createdAt;

    /**
     * Flag indicating if this was a duplicate email
     */
    private Boolean isDuplicate;
}

