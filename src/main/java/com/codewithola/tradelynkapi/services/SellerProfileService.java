package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.dtos.requests.SellerProfileUpdateRequest;
import com.codewithola.tradelynkapi.dtos.requests.SellerStatsDTO;
import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.dtos.response.SellerProfileDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.SellerProfile;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.ForbiddenException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.SellerProfileRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class SellerProfileService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ItemRepository itemRepository;
    private final LikeService likeService;
    private final ItemService itemService;

    @Transactional(readOnly = true)
    public SellerProfileDTO getSellerProfile(Long userId) {
        log.info("Fetching seller profile for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        SellerProfile sellerProfile = sellerProfileRepository.findByUserId(userId)
                .orElse(null);

        // Calculate stats
        List<Item> allItems = itemRepository.findBySellerId(userId);
        List<Item> activeItems = allItems.stream()
                .filter(item -> item.getStatus() == Item.Status.ACTIVE)
                .toList();
        List<Item> soldItems = allItems.stream()
                .filter(item -> item.getStatus() == Item.Status.SOLD)
                .toList();

        // Calculate total likes across all items
        int totalLikes = allItems.stream()
                .mapToInt(Item::getLikeCount)
                .sum();

        return SellerProfileDTO.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .businessName(sellerProfile != null ? sellerProfile.getBusinessName() : null)
                .profilePictureUrl(user.getProfilePictureUrl())
                .address(sellerProfile != null ? sellerProfile.getAddress() : null)
                .memberSince(user.getCreatedAt())
                .totalItems(activeItems.size())
                .totalLikes(totalLikes)
                .totalSales(soldItems.size())
                .isVerified(sellerProfile != null && sellerProfile.getVerified())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<ItemDTO> getSellerItems(Long userId, Pageable pageable, Long currentUserId) {
        log.info("Fetching items for seller ID: {}", userId);

        // Verify seller exists
        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        // Get seller's active items
        Page<Item> items = itemRepository.findBySellerIdAndStatus(userId, Item.Status.ACTIVE, pageable);

        // Get liked items for current user
        Set<Long> likedItemIds = currentUserId != null ?
                likeService.getUserLikedItemIdsAsSet(currentUserId) : Set.of();

        // Convert to DTOs
        return items.map(item -> {
            User seller = userRepository.findById(userId).orElse(null);
            return itemService.convertToDTOPublic(item, seller, likedItemIds);
        });
    }

    @Transactional
    public SellerProfileDTO updateSellerProfile(Long userId, SellerProfileUpdateRequest request) {
        log.info("Updating seller profile for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Get or create seller profile
        SellerProfile sellerProfile = sellerProfileRepository.findByUserId(userId)
                .orElse(SellerProfile.builder()
                        .user(user)
                        .build());

        // Update allowed fields only (no bank details for security)
        if (request.getBusinessName() != null) {
            sellerProfile.setBusinessName(request.getBusinessName());
        }

        if (request.getAddress() != null) {
            sellerProfile.setAddress(request.getAddress());
        }

        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
            userRepository.save(user);
        }

        sellerProfileRepository.save(sellerProfile);

        log.info("Seller profile updated successfully for user ID: {}", userId);

        return getSellerProfile(userId);
    }

    @Transactional(readOnly = true)
    public SellerStatsDTO getSellerStats(Long userId) {
        log.info("Fetching seller stats for user ID: {}", userId);

        userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        List<Item> allItems = itemRepository.findBySellerId(userId);
        List<Item> activeItems = allItems.stream()
                .filter(item -> item.getStatus() == Item.Status.ACTIVE)
                .toList();
        List<Item> soldItems = allItems.stream()
                .filter(item -> item.getStatus() == Item.Status.SOLD)
                .toList();

        int totalLikes = allItems.stream()
                .mapToInt(Item::getLikeCount)
                .sum();

        int totalViews = allItems.stream()
                .mapToInt(Item::getViewCount)
                .sum();

        LocalDateTime lastItemPosted = allItems.stream()
                .map(Item::getCreatedAt)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        return SellerStatsDTO.builder()
                .userId(userId)
                .totalActiveItems(activeItems.size())
                .totalSoldItems(soldItems.size())
                .totalLikes(totalLikes)
                .totalViews(totalViews)
                .lastItemPosted(lastItemPosted)
                .build();
    }

    public void verifySellerOwnership(Long userId, Long requestingUserId) {
        if (!userId.equals(requestingUserId)) {
            throw new ForbiddenException("You can only update your own seller profile");
        }
    }

    /**
     * ✅ Check if a user is a verified seller
     * Returns false if seller profile doesn't exist or if verified is false
     */
    @Transactional(readOnly = true)
    public boolean isVerified(Long userId) {
        log.debug("Checking verification status for user ID: {}", userId);

        return sellerProfileRepository.findByUserId(userId)
                .map(SellerProfile::getVerified)
                .orElse(false);
    }
}