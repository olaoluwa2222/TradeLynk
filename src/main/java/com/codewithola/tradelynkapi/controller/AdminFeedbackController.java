package com.codewithola.tradelynkapi.controller;

import com.codewithola.tradelynkapi.dtos.requests.AdminRespondToFeedbackRequest;
import com.codewithola.tradelynkapi.dtos.response.FeedbackDTO;
import com.codewithola.tradelynkapi.entity.Feedback;
import com.codewithola.tradelynkapi.services.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/feedback")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')") // ✅ Only admins can access these endpoints
public class AdminFeedbackController {

    private final FeedbackService feedbackService;

    /**
     * GET /api/admin/feedback
     * Get all feedback (paginated)
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllFeedback(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/admin/feedback - Page: {}, Size: {}", page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FeedbackDTO> feedbacks = feedbackService.getAllFeedback(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", feedbacks.getContent());
        response.put("currentPage", feedbacks.getNumber());
        response.put("totalPages", feedbacks.getTotalPages());
        response.put("totalItems", feedbacks.getTotalElements());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/feedback/new
     * Get all new (unread) feedback
     */
    @GetMapping("/new")
    public ResponseEntity<Map<String, Object>> getNewFeedback() {
        log.info("GET /api/admin/feedback/new");

        List<FeedbackDTO> feedbacks = feedbackService.getNewFeedback();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", feedbacks);
        response.put("count", feedbacks.size());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/feedback/stats
     * Get feedback statistics (dashboard)
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getFeedbackStatistics() {
        log.info("GET /api/admin/feedback/stats");

        Map<String, Object> stats = feedbackService.getFeedbackStatistics();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/feedback/type/{type}
     * Get feedback by type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<Map<String, Object>> getFeedbackByType(
            @PathVariable Feedback.FeedbackType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/admin/feedback/type/{} - Page: {}, Size: {}", type, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FeedbackDTO> feedbacks = feedbackService.getFeedbackByType(type, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", feedbacks.getContent());
        response.put("currentPage", feedbacks.getNumber());
        response.put("totalPages", feedbacks.getTotalPages());
        response.put("totalItems", feedbacks.getTotalElements());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/feedback/status/{status}
     * Get feedback by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Map<String, Object>> getFeedbackByStatus(
            @PathVariable Feedback.FeedbackStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/admin/feedback/status/{} - Page: {}, Size: {}", status, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FeedbackDTO> feedbacks = feedbackService.getFeedbackByStatus(status, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", feedbacks.getContent());
        response.put("currentPage", feedbacks.getNumber());
        response.put("totalPages", feedbacks.getTotalPages());
        response.put("totalItems", feedbacks.getTotalElements());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/feedback/search
     * Search feedback by keyword
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchFeedback(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/admin/feedback/search?keyword={}", keyword);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<FeedbackDTO> feedbacks = feedbackService.searchFeedback(keyword, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", feedbacks.getContent());
        response.put("currentPage", feedbacks.getNumber());
        response.put("totalPages", feedbacks.getTotalPages());
        response.put("totalItems", feedbacks.getTotalElements());

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/admin/feedback/{id}/respond
     * Respond to feedback
     */
    @PostMapping("/{id}/respond")
    public ResponseEntity<Map<String, Object>> respondToFeedback(
            @PathVariable Long id,
            @Valid @RequestBody AdminRespondToFeedbackRequest request) {

        log.info("POST /api/admin/feedback/{}/respond - Status: {}", id, request.getStatus());

        FeedbackDTO feedback = feedbackService.respondToFeedback(id, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Response sent successfully");
        response.put("data", feedback);

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/admin/feedback/{id}/status
     * Update feedback status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateFeedbackStatus(
            @PathVariable Long id,
            @RequestParam Feedback.FeedbackStatus status) {

        log.info("PUT /api/admin/feedback/{}/status - Status: {}", id, status);

        FeedbackDTO feedback = feedbackService.updateFeedbackStatus(id, status);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Status updated successfully");
        response.put("data", feedback);

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/admin/feedback/{id}
     * Delete feedback (admin)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFeedback(@PathVariable Long id) {
        log.info("DELETE /api/admin/feedback/{}", id);

        feedbackService.deleteFeedback(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Feedback deleted successfully");

        return ResponseEntity.ok(response);
    }
}

/*
 * ADMIN USAGE EXAMPLES:
 *
 * 1. Get Dashboard Statistics:
 *    GET /api/admin/feedback/stats
 *    Response: {
 *      "newCount": 5,
 *      "reviewedCount": 12,
 *      "featureRequestCount": 20,
 *      "bugReportCount": 8,
 *      "recentFeedback": [...]
 *    }
 *
 * 2. Get All New Feedback:
 *    GET /api/admin/feedback/new
 *
 * 3. Get Feature Requests:
 *    GET /api/admin/feedback/type/FEATURE_REQUEST?page=0&size=20
 *
 * 4. Respond to Feedback:
 *    POST /api/admin/feedback/123/respond
 *    Body: {
 *      "response": "Thanks for the suggestion! We're working on this feature...",
 *      "status": "IN_PROGRESS"
 *    }
 *
 * 5. Mark as Completed:
 *    PUT /api/admin/feedback/123/status?status=COMPLETED
 *
 * 6. Search Feedback:
 *    GET /api/admin/feedback/search?keyword=dark mode
 */