package com.codewithola.tradelynkapi.services;


import com.codewithola.tradelynkapi.dtos.requests.SearchFilters;
import com.codewithola.tradelynkapi.dtos.response.ItemDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final EntityManager entityManager;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final LikeService likeService;
    private final ItemService itemService;

    @Transactional(readOnly = true)
    public Page<ItemDTO> searchItems(SearchFilters filters, Long currentUserId) {
        log.info("Searching items with filters: {}", filters);

        // Validate filters
        if (filters.getKeyword() == null || filters.getKeyword().trim().isEmpty()) {
            throw new BadRequestException("Search keyword is required");
        }

        if (!filters.isValidPriceRange()) {
            throw new BadRequestException("Invalid price range: minPrice must be less than or equal to maxPrice");
        }

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Item> query = cb.createQuery(Item.class);
        Root<Item> item = query.from(Item.class);
        Join<Item, User> seller = item.join("seller", JoinType.LEFT);

        // Build predicates (filters)
        List<Predicate> predicates = new ArrayList<>();

        // Always filter by ACTIVE status
        predicates.add(cb.equal(item.get("status"), Item.Status.ACTIVE));

        // Keyword search (title, description, seller name) - case insensitive
        String keyword = "%" + filters.getKeyword().toLowerCase() + "%";
        Predicate keywordPredicate = cb.or(
                cb.like(cb.lower(item.get("title")), keyword),
                cb.like(cb.lower(item.get("description")), keyword),
                cb.like(cb.lower(seller.get("name")), keyword)
        );
        predicates.add(keywordPredicate);

        // Category filter
        if (filters.getCategory() != null) {
            predicates.add(cb.equal(item.get("category"), filters.getCategory()));
        }

        // Price range filter
        if (filters.getMinPrice() != null) {
            predicates.add(cb.greaterThanOrEqualTo(item.get("price"), filters.getMinPrice()));
        }
        if (filters.getMaxPrice() != null) {
            predicates.add(cb.lessThanOrEqualTo(item.get("price"), filters.getMaxPrice()));
        }

        // Condition filter
        if (filters.getCondition() != null) {
            predicates.add(cb.equal(item.get("condition"), filters.getCondition()));
        }

        // Apply all predicates
        query.where(predicates.toArray(new Predicate[0]));

        // Apply sorting
        applySorting(query, cb, item, filters.getSortBy(), filters.getKeyword());

        // Create pageable
        Pageable pageable = PageRequest.of(filters.getPage(), filters.getSize());

        // Execute query with pagination
        List<Item> items = entityManager.createQuery(query)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        // Count total items (for pagination)
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Item> countRoot = countQuery.from(Item.class);
        Join<Item, User> countSeller = countRoot.join("seller", JoinType.LEFT);

        List<Predicate> countPredicates = new ArrayList<>();
        countPredicates.add(cb.equal(countRoot.get("status"), Item.Status.ACTIVE));

        Predicate countKeywordPredicate = cb.or(
                cb.like(cb.lower(countRoot.get("title")), keyword),
                cb.like(cb.lower(countRoot.get("description")), keyword),
                cb.like(cb.lower(countSeller.get("name")), keyword)
        );
        countPredicates.add(countKeywordPredicate);

        if (filters.getCategory() != null) {
            countPredicates.add(cb.equal(countRoot.get("category"), filters.getCategory()));
        }
        if (filters.getMinPrice() != null) {
            countPredicates.add(cb.greaterThanOrEqualTo(countRoot.get("price"), filters.getMinPrice()));
        }
        if (filters.getMaxPrice() != null) {
            countPredicates.add(cb.lessThanOrEqualTo(countRoot.get("price"), filters.getMaxPrice()));
        }
        if (filters.getCondition() != null) {
            countPredicates.add(cb.equal(countRoot.get("condition"), filters.getCondition()));
        }

        countQuery.select(cb.count(countRoot));
        countQuery.where(countPredicates.toArray(new Predicate[0]));
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        // Get liked items for current user
        Set<Long> likedItemIds = currentUserId != null ?
                likeService.getUserLikedItemIdsAsSet(currentUserId) : Set.of();

        // Convert to DTOs
        List<ItemDTO> itemDTOs = items.stream()
                .map(i -> {
                    User sellerUser = userRepository.findById(i.getSeller().getId()).orElse(null);
                    return itemService.convertToDTOPublic(i, sellerUser, likedItemIds);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(itemDTOs, pageable, total);
    }

    private void applySorting(CriteriaQuery<Item> query, CriteriaBuilder cb, Root<Item> item,
                              String sortBy, String keyword) {
        if (sortBy == null) {
            sortBy = "RELEVANCE";
        }

        switch (sortBy.toUpperCase()) {
            case "RELEVANCE":
                // Sort by best match (title match first, then description match)
                // This is a simplified relevance - you can enhance with full-text search
                Expression<Integer> relevanceScore = cb.<Integer>selectCase()
                        .when(cb.like(cb.lower(item.get("title")), "%" + keyword.toLowerCase() + "%"), 3)
                        .when(cb.like(cb.lower(item.get("description")), "%" + keyword.toLowerCase() + "%"), 2)
                        .otherwise(1);

                query.orderBy(
                        cb.desc(relevanceScore),
                        cb.desc(item.get("createdAt"))
                );
                break;

            case "POPULAR":
                query.orderBy(
                        cb.desc(item.get("likeCount")),
                        cb.desc(item.get("createdAt"))
                );
                break;

            case "PRICE_LOW":
                query.orderBy(cb.asc(item.get("price")));
                break;

            case "PRICE_HIGH":
                query.orderBy(cb.desc(item.get("price")));
                break;

            case "RECENT":
            default:
                query.orderBy(cb.desc(item.get("createdAt")));
                break;
        }
    }

    @Transactional(readOnly = true)
    public List<String> getSuggestedKeywords(String partial) {
        log.info("Getting keyword suggestions for: {}", partial);

        if (partial == null || partial.trim().isEmpty()) {
            return List.of();
        }

        String keyword = partial.toLowerCase() + "%";

        // Query to find matching titles
        String jpql = "SELECT i.title FROM Item i " +
                "WHERE LOWER(i.title) LIKE :keyword " +
                "AND i.status = 'ACTIVE' " +
                "ORDER BY i.likeCount DESC, i.createdAt DESC";

        TypedQuery<String> query = entityManager.createQuery(jpql, String.class);
        query.setParameter("keyword", keyword);
        query.setMaxResults(5);

        List<String> suggestions = query.getResultList();

        log.info("Found {} suggestions", suggestions.size());
        return suggestions;
    }

    @Transactional(readOnly = true)
    public List<String> getPopularSearchTerms(int limit) {
        // This could be enhanced by tracking actual user searches in a separate table
        // For now, return popular item titles

        String jpql = "SELECT DISTINCT i.title FROM Item i " +
                "WHERE i.status = 'ACTIVE' " +
                "ORDER BY i.likeCount DESC, i.viewCount DESC";

        TypedQuery<String> query = entityManager.createQuery(jpql, String.class);
        query.setMaxResults(limit);

        return query.getResultList();
    }
}