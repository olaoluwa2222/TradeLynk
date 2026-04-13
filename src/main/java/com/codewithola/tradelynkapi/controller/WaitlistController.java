package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.WaitlistRequest;
import com.codewithola.tradelynkapi.dtos.response.ApiResponse;
import com.codewithola.tradelynkapi.dtos.response.WaitlistResponse;
import com.codewithola.tradelynkapi.services.WaitlistService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Waitlist Controller
 * Handles email capture for marketing landing page (go.tradelynk.app)
 *
 * Base URL: /api/v1/waitlist
 * No authentication required
 * CORS enabled for marketing domains
 */
@RestController
@RequestMapping("/waitlist")
@Slf4j
@CrossOrigin(origins = {"https://go.tradelynk.app", "https://tradelynk.app"}, maxAge = 3600)
public class WaitlistController {

    private final WaitlistService waitlistService;

    @Autowired
    public WaitlistController(WaitlistService waitlistService) {
        this.waitlistService = waitlistService;
    }

    /**
     * Add email to waitlist
     * POST /api/v1/waitlist
     *
     * Request Body:
     * {
     *   "email": "user@example.com",
     *   "source": "go.tradelynk.app"  // optional
     * }
     *
     * Response: 200 OK (new signup)
     * {
     *   "success": true,
     *   "message": "Email added to waitlist successfully",
     *   "data": {
     *     "id": "550e8400-e29b-41d4-a716-446655440000",
     *     "email": "user@example.com",
     *     "source": "go.tradelynk.app",
     *     "createdAt": "2026-04-13T10:30:00Z",
     *     "isDuplicate": false
     *   }
     * }
     *
     * Response: 200 OK (duplicate email)
     * {
     *   "success": true,
     *   "message": "Email already on waitlist",
     *   "data": {
     *     "id": "550e8400-e29b-41d4-a716-446655440000",
     *     "email": "user@example.com",
     *     "source": "go.tradelynk.app",
     *     "createdAt": "2026-04-13T09:15:00Z",
     *     "isDuplicate": true
     *   }
     * }
     *
     * Response: 400 Bad Request (validation error)
     * {
     *   "success": false,
     *   "message": "Email must be a valid email address",
     *   "data": null
     * }
     *
     * @param request the waitlist request with email and optional source
     * @return ResponseEntity with success confirmation
     */
    @PostMapping
    public ResponseEntity<ApiResponse<WaitlistResponse>> addToWaitlist(
            @Valid @RequestBody WaitlistRequest request) {

        log.info("Waitlist signup request received");

        try {
            WaitlistResponse response = waitlistService.addToWaitlist(request);

            // Check if this was a duplicate
            if (Boolean.TRUE.equals(response.getIsDuplicate())) {
                return ResponseEntity.ok(ApiResponse.<WaitlistResponse>builder()
                        .success(true)
                        .message("Email already on waitlist - we've already got you down!")
                        .data(response)
                        .build());
            }

            // New signup
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<WaitlistResponse>builder()
                            .success(true)
                            .message("Email added to waitlist successfully - thanks for your interest!")
                            .data(response)
                            .build());
        } catch (Exception e) {
            log.error("Error processing waitlist signup", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<WaitlistResponse>builder()
                            .success(false)
                            .message("Error processing signup - please try again later")
                            .data(null)
                            .build());
        }
    }

    /**
     * Health check endpoint for waitlist service
     * GET /api/v1/waitlist/health
     *
     * @return response with waitlist stats
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Object>> healthCheck() {
        long count = waitlistService.getWaitlistCount();
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Waitlist service is healthy")
                .data(java.util.Map.of("totalSignups", count))
                .build());
    }
}

