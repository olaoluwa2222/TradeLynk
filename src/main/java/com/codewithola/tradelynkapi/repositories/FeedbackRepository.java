package com.codewithola.tradelynkapi.repositories;

import com.codewithola.tradelynkapi.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    // ✅ Find all feedback by user
    Page<Feedback> findByUserId(Long userId, Pageable pageable);

    // ✅ Find all feedback by type
    Page<Feedback> findByType(Feedback.FeedbackType type, Pageable pageable);

    // ✅ Find all feedback by status
    Page<Feedback> findByStatus(Feedback.FeedbackStatus status, Pageable pageable);

    // ✅ Find all feedback by type and status
    Page<Feedback> findByTypeAndStatus(
            Feedback.FeedbackType type,
            Feedback.FeedbackStatus status,
            Pageable pageable
    );

    // ✅ Count feedback by status
    long countByStatus(Feedback.FeedbackStatus status);

    // ✅ Count feedback by type
    long countByType(Feedback.FeedbackType type);

    // ✅ Find recent feedback (for admin dashboard)
    List<Feedback> findTop10ByOrderByCreatedAtDesc();

    // ✅ Find unread feedback (status = NEW)
    @Query("SELECT f FROM Feedback f WHERE f.status = 'NEW' ORDER BY f.createdAt DESC")
    List<Feedback> findNewFeedback();

    // ✅ Count new feedback
    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.status = 'NEW'")
    long countNewFeedback();

    // ✅ Find feedback by date range
    @Query("SELECT f FROM Feedback f WHERE f.createdAt BETWEEN :startDate AND :endDate ORDER BY f.createdAt DESC")
    List<Feedback> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ✅ Find feedback with no response
    @Query("SELECT f FROM Feedback f WHERE f.adminResponse IS NULL ORDER BY f.createdAt DESC")
    Page<Feedback> findUnansweredFeedback(Pageable pageable);

    // ✅ Search feedback by content
    @Query("SELECT f FROM Feedback f WHERE " +
            "LOWER(f.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(f.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Feedback> searchFeedback(@Param("keyword") String keyword, Pageable pageable);
}