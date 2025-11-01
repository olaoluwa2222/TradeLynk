package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.Like;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.LikeRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LikeService {

    private final LikeRepository likeRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    @Transactional
    public void likeItem(Long itemId, Long userId) {
        log.info("User {} attempting to like item {}", userId, itemId);

        // Check if item exists
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // Check if user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Check if already liked
        if (likeRepository.existsByItemIdAndUserId(itemId, userId)) {
            throw new BadRequestException("You have already liked this item");
        }

        // Create like
        Like like = Like.builder()
                .itemId(itemId)
                .userId(userId)
                .build();

        likeRepository.save(like);

        // Increment item like count
        item.incrementLikeCount();
        itemRepository.save(item);

        log.info("User {} successfully liked item {}", userId, itemId);
    }

    @Transactional
    public void unlikeItem(Long itemId, Long userId) {
        log.info("User {} attempting to unlike item {}", userId, itemId);

        // Check if item exists
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // Check if like exists
        Like like = likeRepository.findByItemIdAndUserId(itemId, userId)
                .orElseThrow(() -> new BadRequestException("You have not liked this item"));

        // Delete like
        likeRepository.delete(like);

        // Decrement item like count
        item.decrementLikeCount();
        itemRepository.save(item);

        log.info("User {} successfully unliked item {}", userId, itemId);
    }

    @Transactional(readOnly = true)
    public boolean hasUserLikedItem(Long itemId, Long userId) {
        return likeRepository.existsByItemIdAndUserId(itemId, userId);
    }

    @Transactional(readOnly = true)
    public Long getLikeCount(Long itemId) {
        return likeRepository.countByItemId(itemId);
    }

    @Transactional(readOnly = true)
    public List<Long> getUserLikedItemIds(Long userId) {
        return likeRepository.findLikedItemIdsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Set<Long> getUserLikedItemIdsAsSet(Long userId) {
        return new HashSet<>(likeRepository.findLikedItemIdsByUserId(userId));
    }

    @Transactional(readOnly = true)
    public List<Long> getTrendingItemIds(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<Object[]> results = likeRepository.findTrendingItems(startDate);

        return results.stream()
                .map(result -> (Long) result[0])
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Item> getLikedItemsByUser(Long userId) {
        List<Long> likedItemIds = getUserLikedItemIds(userId);
        return itemRepository.findAllById(likedItemIds);
    }
}
