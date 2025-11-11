package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.dtos.requests.ItemAnalyticsDTO;
import com.codewithola.tradelynkapi.dtos.requests.SellerAnalyticsDTO;
import com.codewithola.tradelynkapi.dtos.requests.TopItemDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.Payment;
import com.codewithola.tradelynkapi.exception.ForbiddenException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.LikeRepository;
import com.codewithola.tradelynkapi.repositories.PaymentRepository;
import com.codewithola.tradelynkapi.repositories.ReportRepository;
import com.google.firebase.database.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final ItemRepository itemRepository;
    private final PaymentRepository paymentRepository;
    private final LikeRepository likeRepository;
    private final ReportRepository reportRepository;
    private final FirebaseDatabase firebaseDatabase;

    /**
     * Get comprehensive analytics for a seller
     */
    @Transactional(readOnly = true)
    public SellerAnalyticsDTO getSellerAnalytics(Long sellerId) {
        log.info("Fetching analytics for seller: {}", sellerId);

        // Get all seller's items
        List<Item> allItems = itemRepository.findBySellerId(sellerId);

        if (allItems.isEmpty()) {
            return createEmptySellerAnalytics();
        }

        // Filter items by status
        List<Item> activeItems = allItems.stream()
                .filter(item -> item.getStatus() == Item.Status.ACTIVE)
                .collect(Collectors.toList());

        List<Item> soldItems = allItems.stream()
                .filter(item -> item.getStatus() == Item.Status.SOLD)
                .collect(Collectors.toList());

        List<Item> hiddenItems = allItems.stream()
                .filter(item -> item.getStatus() == Item.Status.HIDDEN)
                .collect(Collectors.toList());

        // Calculate engagement metrics
        int totalLikes = allItems.stream()
                .mapToInt(Item::getLikeCount)
                .sum();

        int totalViews = allItems.stream()
                .mapToInt(Item::getViewCount)
                .sum();

        // Get sales metrics
        List<Payment> successfulPayments = paymentRepository.findBySellerId(sellerId)
                .stream()
                .filter(payment -> payment.getStatus() == Payment.PaymentStatus.SUCCESS)
                .collect(Collectors.toList());

        int totalSales = successfulPayments.size();

        long totalRevenue = successfulPayments.stream()
                .mapToLong(Payment::getAmount)
                .sum();

        // Calculate average item price
        double averageItemPrice = allItems.stream()
                .filter(item -> item.getPrice() != null)
                .mapToLong(Item::getPrice)
                .average()
                .orElse(0.0);

        // Calculate conversion rate (sales / views)
        double conversionRate = totalViews > 0 ?
                ((double) totalSales / totalViews) * 100 : 0.0;

        // Get last activity dates
        LocalDateTime lastItemPosted = allItems.stream()
                .map(Item::getCreatedAt)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime lastSale = successfulPayments.stream()
                .map(Payment::getPaidAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        // Get total chats (from Firebase)
        int totalChats = getTotalChatsForSeller(sellerId);

        // Get top performing items
        List<TopItemDTO> topLikedItems = getTopItemsByMetric(allItems, "likes", 5);
        List<TopItemDTO> topViewedItems = getTopItemsByMetric(allItems, "views", 5);
        List<TopItemDTO> topRevenueItems = getTopRevenueItems(sellerId, 5);

        return SellerAnalyticsDTO.builder()
                .totalItemsPosted(allItems.size())
                .activeItems(activeItems.size())
                .soldItems(soldItems.size())
                .hiddenItems(hiddenItems.size())
                .totalLikes(totalLikes)
                .totalViews(totalViews)
                .totalChats(totalChats)
                .totalSales(totalSales)
                .totalRevenue(totalRevenue)
                .averageItemPrice(averageItemPrice)
                .conversionRate(Math.round(conversionRate * 100.0) / 100.0)
                .lastItemPosted(lastItemPosted)
                .lastSale(lastSale)
                .topLikedItems(topLikedItems)
                .topViewedItems(topViewedItems)
                .topRevenueItems(topRevenueItems)
                .build();
    }

    /**
     * Get detailed analytics for a specific item
     */
    @Transactional(readOnly = true)
    public ItemAnalyticsDTO getItemAnalytics(Long itemId, Long requestingUserId) {
        log.info("Fetching analytics for item: {}", itemId);

        // Get item
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        // Verify requesting user is the seller
        if (!item.getSeller().getId().equals(requestingUserId)) {
            throw new ForbiddenException("You can only view analytics for your own items");
        }

        // Get chat count and interested buyers
        int chatCount = getChatCountForItem(itemId);
        int interestedBuyers = getInterestedBuyersCount(itemId);

        // Calculate engagement rate
        double engagementRate = item.getViewCount() > 0 ?
                ((double) (item.getLikeCount() + chatCount) / item.getViewCount()) * 100 : 0.0;

        // Get report count
        long reportCount = reportRepository.countByItemId(itemId);

        // Get sales info
        Payment successfulPayment = paymentRepository.findByItemId(itemId).stream()
                .filter(payment -> payment.getStatus() == Payment.PaymentStatus.SUCCESS)
                .findFirst()
                .orElse(null);

        boolean isSold = successfulPayment != null;
        Long soldPrice = isSold ? successfulPayment.getAmount() : null;
        LocalDateTime soldAt = isSold ? successfulPayment.getPaidAt() : null;

        // Calculate days active
        long daysActive = ChronoUnit.DAYS.between(item.getCreatedAt(), LocalDateTime.now());

        return ItemAnalyticsDTO.builder()
                .itemId(item.getId())
                .itemTitle(item.getTitle())
                .itemStatus(item.getStatus().name())
                .likeCount(item.getLikeCount())
                .viewCount(item.getViewCount())
                .chatCount(chatCount)
                .interestedBuyers(interestedBuyers)
                .engagementRate(Math.round(engagementRate * 100.0) / 100.0)
                .reportCount(reportCount)
                .isSold(isSold)
                .soldPrice(soldPrice)
                .soldAt(soldAt)
                .createdAt(item.getCreatedAt())
                .daysActive((int) daysActive)
                .build();
    }

    /**
     * Get total chat count for seller (from Firebase)
     */
    private int getTotalChatsForSeller(Long sellerId) {
        try {
            CompletableFuture<Integer> future = new CompletableFuture<>();

            DatabaseReference userChatsRef = firebaseDatabase.getReference("userChats")
                    .child(String.valueOf(sellerId));

            userChatsRef.addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot snapshot) {
                    int count = (int) snapshot.getChildrenCount();
                    future.complete(count);
                }

                @Override
                public void onCancelled(DatabaseError error) {
                    log.error("Error fetching seller chats: {}", error.getMessage());
                    future.complete(0);
                }
            });

            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error getting total chats for seller", e);
            return 0;
        }
    }

    /**
     * Get chat count for specific item (from Firebase)
     */
    private int getChatCountForItem(Long itemId) {
        try {
            CompletableFuture<Integer> future = new CompletableFuture<>();

            DatabaseReference chatsRef = firebaseDatabase.getReference("chats");

            chatsRef.orderByChild("itemId").equalTo(itemId)
                    .addListenerForSingleValueEvent(new ValueEventListener() {
                        @Override
                        public void onDataChange(DataSnapshot snapshot) {
                            int count = (int) snapshot.getChildrenCount();
                            future.complete(count);
                        }

                        @Override
                        public void onCancelled(DatabaseError error) {
                            log.error("Error fetching item chats: {}", error.getMessage());
                            future.complete(0);
                        }
                    });

            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error getting chat count for item", e);
            return 0;
        }
    }

    /**
     * Get unique interested buyers count (from Firebase)
     */
    private int getInterestedBuyersCount(Long itemId) {
        try {
            CompletableFuture<Integer> future = new CompletableFuture<>();

            DatabaseReference chatsRef = firebaseDatabase.getReference("chats");

            chatsRef.orderByChild("itemId").equalTo(itemId)
                    .addListenerForSingleValueEvent(new ValueEventListener() {
                        @Override
                        public void onDataChange(DataSnapshot snapshot) {
                            Set<Long> uniqueBuyers = new HashSet<>();

                            for (DataSnapshot chatSnapshot : snapshot.getChildren()) {
                                Long buyerId = chatSnapshot.child("buyerId").getValue(Long.class);
                                if (buyerId != null) {
                                    uniqueBuyers.add(buyerId);
                                }
                            }

                            future.complete(uniqueBuyers.size());
                        }

                        @Override
                        public void onCancelled(DatabaseError error) {
                            log.error("Error fetching interested buyers: {}", error.getMessage());
                            future.complete(0);
                        }
                    });

            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error getting interested buyers count", e);
            return 0;
        }
    }

    /**
     * Get top items by metric (likes or views)
     */
    private List<TopItemDTO> getTopItemsByMetric(List<Item> items, String metric, int limit) {
        Comparator<Item> comparator = metric.equals("likes") ?
                Comparator.comparingInt(Item::getLikeCount).reversed() :
                Comparator.comparingInt(Item::getViewCount).reversed();

        return items.stream()
                .sorted(comparator)
                .limit(limit)
                .map(item -> TopItemDTO.builder()
                        .itemId(item.getId())
                        .title(item.getTitle())
                        .imageUrl(getFirstImageUrl(item))
                        .price(item.getPrice())
                        .likeCount(item.getLikeCount())
                        .viewCount(item.getViewCount())
                        .status(item.getStatus().name())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get top revenue-generating items
     */
    private List<TopItemDTO> getTopRevenueItems(Long sellerId, int limit) {
        List<Payment> successfulPayments = paymentRepository.findBySellerId(sellerId)
                .stream()
                .filter(payment -> payment.getStatus() == Payment.PaymentStatus.SUCCESS)
                .sorted(Comparator.comparingLong(Payment::getAmount).reversed())
                .limit(limit)
                .collect(Collectors.toList());

        return successfulPayments.stream()
                .map(payment -> {
                    Item item = itemRepository.findById(payment.getItemId()).orElse(null);
                    if (item == null) return null;

                    return TopItemDTO.builder()
                            .itemId(item.getId())
                            .title(item.getTitle())
                            .imageUrl(getFirstImageUrl(item))
                            .price(item.getPrice())
                            .revenue(payment.getAmount())
                            .status(item.getStatus().name())
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private SellerAnalyticsDTO createEmptySellerAnalytics() {
        return SellerAnalyticsDTO.builder()
                .totalItemsPosted(0)
                .activeItems(0)
                .soldItems(0)
                .hiddenItems(0)
                .totalLikes(0)
                .totalViews(0)
                .totalChats(0)
                .totalSales(0)
                .totalRevenue(0L)
                .averageItemPrice(0.0)
                .conversionRate(0.0)
                .topLikedItems(new ArrayList<>())
                .topViewedItems(new ArrayList<>())
                .topRevenueItems(new ArrayList<>())
                .build();
    }

    private String getFirstImageUrl(Item item) {
        try {
            if (item.getImageUrls() != null && !item.getImageUrls().isEmpty()) {
                String imageUrls = item.getImageUrls();
                if (imageUrls.startsWith("[")) {
                    return imageUrls.substring(2, imageUrls.indexOf("\"", 2));
                }
            }
        } catch (Exception e) {
            log.error("Error parsing image URLs", e);
        }
        return null;
    }
}
