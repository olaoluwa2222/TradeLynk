package com.codewithola.tradelynkapi.dtos.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Generic pagination response wrapper
 * Provides consistent pagination structure across all endpoints
 *
 * @param <T> Type of content in the page
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    /**
     * List of items in current page
     */
    private List<T> content;

    /**
     * Current page number (0-indexed)
     */
    private int page;

    /**
     * Number of items per page
     */
    private int size;

    /**
     * Total number of items across all pages
     */
    private long totalElements;

    /**
     * Total number of pages
     */
    private int totalPages;

    /**
     * Whether there is a next page
     */
    private boolean hasNext;

    /**
     * Whether there is a previous page
     */
    private boolean hasPrevious;

    /**
     * Whether this is the first page
     */
    private boolean isFirst;

    /**
     * Whether this is the last page
     */
    private boolean isLast;

    /**
     * Whether the page is empty
     */
    private boolean isEmpty;

    /**
     * Create PageResponse from Spring Data Page
     *
     * @param page Spring Data Page object
     * @param <T> Type of content
     * @return PageResponse with all pagination metadata
     */
    public static <T> PageResponse<T> of(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .isEmpty(page.isEmpty())
                .build();
    }

    /**
     * Create PageResponse with custom content but same pagination metadata
     * Useful when you need to transform the content but keep pagination info
     *
     * @param page Original Spring Data Page
     * @param content Transformed content
     * @param <T> Type of new content
     * @param <U> Type of original content
     * @return PageResponse with transformed content
     */
    public static <T, U> PageResponse<T> of(Page<U> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .isEmpty(page.isEmpty())
                .build();
    }
}