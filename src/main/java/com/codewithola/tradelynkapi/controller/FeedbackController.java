package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.SubmitFeedbackRequest;
import com.codewithola.tradelynkapi.dtos.response.FeedbackDTO;
import com.codewithola.tradelynkapi.entity.Feedback;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
@Slf4j
public class FeedbackController {

    private final FeedbackService feedbackService;

    /**
     * POST /api/feedback
     * Submit feedback (authenticated or anonymous)
     *
     * Authenticated users: Just send the request body, user info is extracted from JWT
     * Anonymous users: Must provide contactEmail or contactWhatsApp
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitFeedback(
            @Valid @RequestBody SubmitFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/feedback - Type: {}, User: {}",
                request.getType(),
                userPrincipal != null ? userPrincipal.getEmail() : "Anonymous");

        // Extract userId if authenticated, null otherwise
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;

        // Submit feedback
        FeedbackDTO feedback = feedbackService.submitFeedback(request, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Thank you for your feedback! We'll review it soon.");
        response.put("data", feedback);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/feedback/my-feedback
     * Get current user's feedback (requires authentication)
     */
    @GetMapping("/my-feedback")
    public ResponseEntity<Map<String, Object>> getMyFeedback(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("GET /api/feedback/my-feedback - User: {}", userPrincipal.getEmail());

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FeedbackDTO> feedbacks = feedbackService.getUserFeedback(userPrincipal.getId(), pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", feedbacks.getContent());
        response.put("currentPage", feedbacks.getNumber());
        response.put("totalPages", feedbacks.getTotalPages());
        response.put("totalItems", feedbacks.getTotalElements());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/feedback/{id}
     * Get specific feedback by ID (user must own it)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getFeedbackById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("GET /api/feedback/{} - User: {}", id, userPrincipal.getEmail());

        FeedbackDTO feedback = feedbackService.getFeedbackById(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", feedback);

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/feedback/{id}
     * Delete user's own feedback
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFeedback(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/feedback/{} - User: {}", id, userPrincipal.getEmail());

        feedbackService.deleteUserFeedback(id, userPrincipal.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Feedback deleted successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/feedback/types
     * Get available feedback types
     */
    @GetMapping("/types")
    public ResponseEntity<Map<String, Object>> getFeedbackTypes() {
        log.info("GET /api/feedback/types");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("types", Feedback.FeedbackType.values());

        return ResponseEntity.ok(response);
    }
}

/*
 * USAGE EXAMPLES FOR FRONTEND:
 *
 * 1. Submit Authenticated Feedback:
 *    POST /api/feedback
 *    Headers: { Authorization: "Bearer <token>" }
 *    Body: {
 *      "type": "FEATURE_REQUEST",
 *      "title": "Add dark mode to storefront",
 *      "content": "I would love to have a dark mode option for my store...",
 *      "rating": 5,
 *      "imageUrls": ["https://...screenshot.png"],
 *      "pageUrl": "https://tradelynk.app/sellers/my-store"
 *    }
 *
 * 2. Submit Anonymous Feedback:
 *    POST /api/feedback
 *    Body: {
 *      "type": "BUG_REPORT",
 *      "title": "Upload button not working",
 *      "content": "When I try to upload images...",
 *      "contactEmail": "user@example.com",
 *      "contactWhatsApp": "+2348012345678"
 *    }
 *
 * 3. Get My Feedback:
 *    GET /api/feedback/my-feedback?page=0&size=10
 *    Headers: { Authorization: "Bearer <token>" }
 *
 * 4. Get Specific Feedback:
 *    GET /api/feedback/123
 *    Headers: { Authorization: "Bearer <token>" }
 *
 * 5. Delete My Feedback:
 *    DELETE /api/feedback/123
 *    Headers: { Authorization: "Bearer <token>" }
 */