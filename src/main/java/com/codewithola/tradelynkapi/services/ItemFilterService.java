package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItemFilterService {

    private final EntityManager entityManager;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final LikeService likeService;
    private final ItemService itemService;

    @Transactional(readOnly = true)
    public Page<ItemDTO> filterItems(
            Item.Category category,
            Long minPrice,
            Long maxPrice,
            Item.Condition condition,
            String sortBy,
            Long currentUserId,
            Pageable pageable) {

        log.info("Filtering items - category: {}, minPrice: {}, maxPrice: {}, condition: {}, sort: {}",
                category, minPrice, maxPrice, condition, sortBy);

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // ========== MAIN QUERY ==========
        CriteriaQuery<Item> query = cb.createQuery(Item.class);
        Root<Item> item = query.from(Item.class);

        // Build predicates for main query
        List<Predicate> predicates = buildPredicates(cb, item, category, minPrice, maxPrice, condition);

        query.where(predicates.toArray(new Predicate[0]));
        applySorting(query, cb, item, sortBy);

        // Execute main query with pagination
        List<Item> items = entityManager.createQuery(query)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        // ========== COUNT QUERY (FIXED) ==========
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Item> countRoot = countQuery.from(Item.class);

        // ✅ Rebuild predicates with the NEW root
        List<Predicate> countPredicates = buildPredicates(cb, countRoot, category, minPrice, maxPrice, condition);

        countQuery.select(cb.count(countRoot));
        countQuery.where(countPredicates.toArray(new Predicate[0]));

        Long total = entityManager.createQuery(countQuery).getSingleResult();

        // Get liked items for current user
        Set<Long> likedItemIds = currentUserId != null ?
                likeService.getUserLikedItemIdsAsSet(currentUserId) : Set.of();

        // Convert to DTOs
        List<ItemDTO> itemDTOs = items.stream()
                .map(i -> {
                    User seller = userRepository.findById(i.getSeller().getId()).orElse(null);
                    return itemService.convertToDTOPublic(i, seller, likedItemIds);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(itemDTOs, pageable, total);
    }

    // ✅ Extract predicate building logic into a separate method
    private List<Predicate> buildPredicates(
            CriteriaBuilder cb,
            Root<Item> root,
            Item.Category category,
            Long minPrice,
            Long maxPrice,
            Item.Condition condition) {

        List<Predicate> predicates = new ArrayList<>();

        // Always filter by ACTIVE status
        predicates.add(cb.equal(root.get("status"), Item.Status.ACTIVE));

        // Category filter
        if (category != null) {
            predicates.add(cb.equal(root.get("category"), category));
        }

        // Price range filter
        if (minPrice != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }

        // Condition filter
        if (condition != null) {
            predicates.add(cb.equal(root.get("condition"), condition));
        }

        return predicates;
    }

    private void applySorting(CriteriaQuery<Item> query, CriteriaBuilder cb, Root<Item> item, String sortBy) {
        if (sortBy == null) {
            sortBy = "RECENT";
        }

        switch (sortBy.toUpperCase()) {
            case "POPULAR":
                // Sort by like count descending, then by created date
                query.orderBy(
                        cb.desc(item.get("likeCount")),
                        cb.desc(item.get("createdAt"))
                );
                break;

            case "PRICE_LOW":
                // Sort by price ascending
                query.orderBy(cb.asc(item.get("price")));
                break;

            case "PRICE_HIGH":
                // Sort by price descending
                query.orderBy(cb.desc(item.get("price")));
                break;

            case "VIEWS":
                // Sort by view count descending
                query.orderBy(cb.desc(item.get("viewCount")));
                break;

            case "RECENT":
            default:
                // Sort by created date descending (most recent first)
                query.orderBy(cb.desc(item.get("createdAt")));
                break;
        }
    }

    @Transactional(readOnly = true)
    public List<ItemDTO> getTrendingItems(int days, int limit, Long currentUserId) {
        log.info("Fetching trending items from last {} days with engagement scoring", days);

        LocalDateTime startDate = LocalDateTime.now().minusDays(days);

        // Build query with engagement scoring
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Item> query = cb.createQuery(Item.class);
        Root<Item> item = query.from(Item.class);

        // Filter: Active items created/updated in last N days
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(item.get("status"), Item.Status.ACTIVE));

        // Include items created OR updated recently
        Predicate recentlyCreated = cb.greaterThanOrEqualTo(item.get("createdAt"), startDate);
        Predicate recentlyUpdated = cb.greaterThanOrEqualTo(item.get("updatedAt"), startDate);
        predicates.add(cb.or(recentlyCreated, recentlyUpdated));

        query.where(predicates.toArray(new Predicate[0]));

        // Calculate engagement score: (likes * 2) + views + recency_bonus
        // Items get a recency bonus based on how recently they were created
        Expression<Long> likeScore = cb.prod(
                cb.coalesce(item.get("likeCount"), 0L),
                2L
        );
        Expression<Long> viewScore = cb.coalesce(item.get("viewCount"), 0L);

        // Combine scores
        Expression<Long> engagementScore = cb.sum(likeScore, viewScore);

        // Order by engagement score (desc), then by creation date (desc)
        query.orderBy(
                cb.desc(engagementScore),
                cb.desc(item.get("createdAt"))
        );

        // Execute query
        List<Item> trendingItems = entityManager.createQuery(query)
                .setMaxResults(limit)
                .getResultList();

        // Get liked items for current user
        Set<Long> likedItemIds = currentUserId != null ?
                likeService.getUserLikedItemIdsAsSet(currentUserId) : Set.of();

        // Convert to DTOs
        return trendingItems.stream()
                .map(i -> {
                    User seller = userRepository.findById(i.getSeller().getId()).orElse(null);
                    return itemService.convertToDTOPublic(i, seller, likedItemIds);
                })
                .collect(Collectors.toList());
    }
}
