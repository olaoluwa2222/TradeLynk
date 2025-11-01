package com.codewithola.tradelynkapi.repositories;


import com.codewithola.tradelynkapi.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    Optional<Like> findByItemIdAndUserId(Long itemId, Long userId);

    Long countByItemId(Long itemId);

    void deleteByItemIdAndUserId(Long itemId, Long userId);

    boolean existsByItemIdAndUserId(Long itemId, Long userId);

    List<Like> findByUserId(Long userId);

    List<Like> findByItemId(Long itemId);

    @Query("SELECT l.itemId, COUNT(l) as likeCount FROM Like l " +
            "WHERE l.createdAt >= :startDate " +
            "GROUP BY l.itemId " +
            "ORDER BY likeCount DESC")
    List<Object[]> findTrendingItems(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT l.itemId FROM Like l WHERE l.userId = :userId")
    List<Long> findLikedItemIdsByUserId(@Param("userId") Long userId);
}
