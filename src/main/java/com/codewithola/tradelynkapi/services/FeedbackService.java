package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.requests.AdminRespondToFeedbackRequest;
import com.codewithola.tradelynkapi.dtos.requests.SubmitFeedbackRequest;
import com.codewithola.tradelynkapi.dtos.response.FeedbackDTO;
import com.codewithola.tradelynkapi.entity.Feedback;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.ForbiddenException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.FeedbackRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /**
     * Submit feedback (authenticated or anonymous)
     */
    @Transactional
    public FeedbackDTO submitFeedback(SubmitFeedbackRequest request, Long userId) {
        log.info("Submitting feedback from user: {}", userId != null ? userId : "Anonymous");

        // Get user if authenticated
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        // Convert image URLs to JSON string
        String imageUrlsJson = null;
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            try {
                imageUrlsJson = objectMapper.writeValueAsString(request.getImageUrls());
            } catch (JsonProcessingException e) {
                log.error("Error converting image URLs to JSON", e);
            }
        }

        // Create feedback entity
        Feedback feedback = Feedback.builder()
                .user(user)
                .type(request.getType())
                .title(request.getTitle())
                .content(request.getContent())
                .rating(request.getRating())
                .imageUrls(imageUrlsJson)
                .contactEmail(request.getContactEmail())
                .contactWhatsApp(request.getContactWhatsApp())
                .pageUrl(request.getPageUrl())
                .userAgent(request.getUserAgent())
                .status(Feedback.FeedbackStatus.NEW)
                .build();

        // Save to database
        Feedback savedFeedback = feedbackRepository.save(feedback);

        log.info("✅ Feedback submitted successfully: ID={}, Type={}",
                savedFeedback.getId(), savedFeedback.getType());

        return FeedbackDTO.fromEntity(savedFeedback);
    }

    /**
     * Get all feedback for a user
     */
    @Transactional(readOnly = true)
    public Page<FeedbackDTO> getUserFeedback(Long userId, Pageable pageable) {
        log.info("Fetching feedback for user: {}", userId);

        Page<Feedback> feedbacks = feedbackRepository.findByUserId(userId, pageable);
        return feedbacks.map(FeedbackDTO::fromEntity);
    }

    /**
     * Get feedback by ID
     */
    @Transactional(readOnly = true)
    public FeedbackDTO getFeedbackById(Long feedbackId, Long userId) {
        log.info("Fetching feedback: {}", feedbackId);

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));

        // Verify user has access to this feedback
        if (feedback.getUser() != null && !feedback.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You don't have access to this feedback");
        }

        return FeedbackDTO.fromEntity(feedback);
    }

    /**
     * ADMIN: Get all feedback
     */
    @Transactional(readOnly = true)
    public Page<FeedbackDTO> getAllFeedback(Pageable pageable) {
        log.info("Admin fetching all feedback");

        Page<Feedback> feedbacks = feedbackRepository.findAll(pageable);
        return feedbacks.map(FeedbackDTO::fromEntity);
    }

    /**
     * ADMIN: Get feedback by type
     */
    @Transactional(readOnly = true)
    public Page<FeedbackDTO> getFeedbackByType(Feedback.FeedbackType type, Pageable pageable) {
        log.info("Admin fetching feedback by type: {}", type);

        Page<Feedback> feedbacks = feedbackRepository.findByType(type, pageable);
        return feedbacks.map(FeedbackDTO::fromEntity);
    }

    /**
     * ADMIN: Get feedback by status
     */
    @Transactional(readOnly = true)
    public Page<FeedbackDTO> getFeedbackByStatus(Feedback.FeedbackStatus status, Pageable pageable) {
        log.info("Admin fetching feedback by status: {}", status);

        Page<Feedback> feedbacks = feedbackRepository.findByStatus(status, pageable);
        return feedbacks.map(FeedbackDTO::fromEntity);
    }

    /**
     * ADMIN: Get new feedback
     */
    @Transactional(readOnly = true)
    public List<FeedbackDTO> getNewFeedback() {
        log.info("Admin fetching new feedback");

        List<Feedback> feedbacks = feedbackRepository.findNewFeedback();
        return feedbacks.stream()
                .map(FeedbackDTO::fromEntity)
                .toList();
    }

    /**
     * ADMIN: Get feedback statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFeedbackStatistics() {
        log.info("Admin fetching feedback statistics");

        Map<String, Object> stats = new HashMap<>();

        // Count by status
        stats.put("newCount", feedbackRepository.countByStatus(Feedback.FeedbackStatus.NEW));
        stats.put("reviewedCount", feedbackRepository.countByStatus(Feedback.FeedbackStatus.REVIEWED));
        stats.put("inProgressCount", feedbackRepository.countByStatus(Feedback.FeedbackStatus.IN_PROGRESS));
        stats.put("completedCount", feedbackRepository.countByStatus(Feedback.FeedbackStatus.COMPLETED));
        stats.put("closedCount", feedbackRepository.countByStatus(Feedback.FeedbackStatus.CLOSED));

        // Count by type
        stats.put("featureRequestCount", feedbackRepository.countByType(Feedback.FeedbackType.FEATURE_REQUEST));
        stats.put("bugReportCount", feedbackRepository.countByType(Feedback.FeedbackType.BUG_REPORT));
        stats.put("generalFeedbackCount", feedbackRepository.countByType(Feedback.FeedbackType.GENERAL_FEEDBACK));
        stats.put("templateRequestCount", feedbackRepository.countByType(Feedback.FeedbackType.TEMPLATE_REQUEST));
        stats.put("complaintCount", feedbackRepository.countByType(Feedback.FeedbackType.COMPLAINT));

        // Total count
        stats.put("totalCount", feedbackRepository.count());

        // Recent feedback
        List<FeedbackDTO> recentFeedback = feedbackRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(FeedbackDTO::fromEntity)
                .toList();
        stats.put("recentFeedback", recentFeedback);

        return stats;
    }

    /**
     * ADMIN: Respond to feedback
     */
    @Transactional
    public FeedbackDTO respondToFeedback(Long feedbackId, AdminRespondToFeedbackRequest request) {
        log.info("Admin responding to feedback: {}", feedbackId);

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));

        // Update response and status
        feedback.setAdminResponse(request.getResponse());
        feedback.setRespondedAt(LocalDateTime.now());
        feedback.setStatus(request.getStatus());

        Feedback updatedFeedback = feedbackRepository.save(feedback);

        log.info("✅ Admin responded to feedback: ID={}, Status={}",
                feedbackId, request.getStatus());

        // TODO: Send email/notification to user if they provided contact info

        return FeedbackDTO.fromEntity(updatedFeedback);
    }

    /**
     * ADMIN: Update feedback status
     */
    @Transactional
    public FeedbackDTO updateFeedbackStatus(Long feedbackId, Feedback.FeedbackStatus status) {
        log.info("Admin updating feedback status: ID={}, Status={}", feedbackId, status);

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));

        feedback.setStatus(status);
        Feedback updatedFeedback = feedbackRepository.save(feedback);

        log.info("✅ Feedback status updated: ID={}, Status={}", feedbackId, status);

        return FeedbackDTO.fromEntity(updatedFeedback);
    }

    /**
     * ADMIN: Search feedback
     */
    @Transactional(readOnly = true)
    public Page<FeedbackDTO> searchFeedback(String keyword, Pageable pageable) {
        log.info("Admin searching feedback with keyword: {}", keyword);

        Page<Feedback> feedbacks = feedbackRepository.searchFeedback(keyword, pageable);
        return feedbacks.map(FeedbackDTO::fromEntity);
    }

    /**
     * ADMIN: Delete feedback
     */
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        log.info("Admin deleting feedback: {}", feedbackId);

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));

        feedbackRepository.delete(feedback);

        log.info("✅ Feedback deleted: ID={}", feedbackId);
    }

    /**
     * User: Delete their own feedback
     */
    @Transactional
    public void deleteUserFeedback(Long feedbackId, Long userId) {
        log.info("User {} deleting feedback: {}", userId, feedbackId);

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found"));

        // Verify user owns this feedback
        if (feedback.getUser() == null || !feedback.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own feedback");
        }

        feedbackRepository.delete(feedback);

        log.info("✅ User feedback deleted: ID={}", feedbackId);
    }
}