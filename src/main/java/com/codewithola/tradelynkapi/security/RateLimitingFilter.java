package com.codewithola.tradelynkapi.security;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Rate Limiting Filter
 *
 * Prevents abuse by limiting the number of requests per user/IP
 * Uses in-memory cache (ConcurrentHashMap) for simplicity
 *
 * For production with multiple servers, use Redis-based rate limiting:
 * - Spring Cloud Gateway Rate Limiter
 * - Bucket4j with Redis
 * - Redis Rate Limiter
 */
@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    // In-memory storage for rate limiting
    // Key: user ID or IP address
    // Value: RateLimitInfo (request count, window start time)
    private final Map<String, RateLimitInfo> rateLimitStore = new ConcurrentHashMap<>();

    // Rate limit configurations (requests per time window)
    private static final int AUTH_REQUESTS_PER_MINUTE = 10;
    private static final int ITEM_CREATE_REQUESTS_PER_HOUR = 10;
    private static final int IMAGE_UPLOAD_REQUESTS_PER_HOUR = 20;
    private static final int DEFAULT_REQUESTS_PER_MINUTE = 60;

    // Time windows in milliseconds
    private static final long ONE_MINUTE = 60 * 1000;
    private static final long ONE_HOUR = 60 * 60 * 1000;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String key = getRateLimitKey(request);

        // Determine rate limit based on endpoint
        RateLimitConfig config = getRateLimitConfig(requestURI, request.getMethod());

        // Check rate limit
        if (isRateLimitExceeded(key, config)) {
            log.warn("Rate limit exceeded for key: {} on endpoint: {}", key, requestURI);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                    "{\"error\":\"Too many requests\",\"message\":\"Rate limit exceeded. Please try again in %d seconds.\"}",
                    config.getTimeWindow() / 1000
            ));

            // Add rate limit headers
            response.setHeader("X-RateLimit-Limit", String.valueOf(config.getMaxRequests()));
            response.setHeader("X-RateLimit-Remaining", "0");
            response.setHeader("X-RateLimit-Reset", String.valueOf(getResetTime(key, config)));

            return;
        }

        // Add rate limit headers to response
        RateLimitInfo info = rateLimitStore.get(key);
        if (info != null) {
            response.setHeader("X-RateLimit-Limit", String.valueOf(config.getMaxRequests()));
            response.setHeader("X-RateLimit-Remaining",
                    String.valueOf(Math.max(0, config.getMaxRequests() - info.getRequestCount())));
            response.setHeader("X-RateLimit-Reset", String.valueOf(getResetTime(key, config)));
        }

        // Continue with request
        filterChain.doFilter(request, response);
    }

    /**
     * Get rate limit key (user ID or IP address)
     */
    private String getRateLimitKey(HttpServletRequest request) {
        // Try to get user ID from request attribute (set by JWT filter)
        Object userId = request.getAttribute("userId");

        if (userId != null) {
            return "user:" + userId;
        }

        // Fallback to IP address for unauthenticated requests
        String clientIP = getClientIP(request);
        return "ip:" + clientIP;
    }

    /**
     * Get client IP address (handles proxies)
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");

        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }

        return request.getRemoteAddr();
    }

    /**
     * Determine rate limit configuration based on endpoint
     */
    private RateLimitConfig getRateLimitConfig(String uri, String method) {
        // Auth endpoints: 5 requests per minute
        if (uri.contains("/api/v1/auth/")) {
            return new RateLimitConfig(AUTH_REQUESTS_PER_MINUTE, ONE_MINUTE);
        }

        // Item creation: 10 requests per hour
        if (uri.equals("/api/v1/items") && "POST".equalsIgnoreCase(method)) {
            return new RateLimitConfig(ITEM_CREATE_REQUESTS_PER_HOUR, ONE_HOUR);
        }

        // Image upload: 20 requests per hour
        if (uri.contains("/api/v1/images/upload")) {
            return new RateLimitConfig(IMAGE_UPLOAD_REQUESTS_PER_HOUR, ONE_HOUR);
        }

        // Default: 60 requests per minute
        return new RateLimitConfig(DEFAULT_REQUESTS_PER_MINUTE, ONE_MINUTE);
    }

    /**
     * Check if rate limit is exceeded
     */
    private boolean isRateLimitExceeded(String key, RateLimitConfig config) {
        long currentTime = System.currentTimeMillis();

        rateLimitStore.compute(key, (k, info) -> {
            if (info == null || currentTime - info.getWindowStart() > config.getTimeWindow()) {
                // Start new window
                return new RateLimitInfo(1, currentTime);
            }

            // Increment request count
            info.incrementRequestCount();
            return info;
        });

        RateLimitInfo info = rateLimitStore.get(key);
        return info.getRequestCount() > config.getMaxRequests();
    }

    /**
     * Get reset time for rate limit window
     */
    private long getResetTime(String key, RateLimitConfig config) {
        RateLimitInfo info = rateLimitStore.get(key);
        if (info == null) {
            return System.currentTimeMillis() + config.getTimeWindow();
        }
        return info.getWindowStart() + config.getTimeWindow();
    }

    /**
     * Cleanup old entries periodically (prevents memory leak)
     * Called by scheduled task
     */
    public void cleanup() {
        long currentTime = System.currentTimeMillis();
        long maxAge = ONE_HOUR * 2; // Remove entries older than 2 hours

        rateLimitStore.entrySet().removeIf(entry ->
                currentTime - entry.getValue().getWindowStart() > maxAge
        );

        log.debug("Rate limit cache cleanup completed. Current size: {}", rateLimitStore.size());
    }

    /**
     * Rate limit configuration
     */
    @Getter
    private static class RateLimitConfig {
        private final int maxRequests;
        private final long timeWindow;

        public RateLimitConfig(int maxRequests, long timeWindow) {
            this.maxRequests = maxRequests;
            this.timeWindow = timeWindow;
        }

    }

    /**
     * Rate limit information per key
     */
    private static class RateLimitInfo {
        private final AtomicInteger requestCount;
        @Getter
        private final long windowStart;

        public RateLimitInfo(int initialCount, long windowStart) {
            this.requestCount = new AtomicInteger(initialCount);
            this.windowStart = windowStart;
        }

        public void incrementRequestCount() {
            requestCount.incrementAndGet();
        }

        public int getRequestCount() {
            return requestCount.get();
        }

    }
}

/*
 * CONFIGURATION IN SECURITYCONFIG.JAVA:
 *
 * Add RateLimitingFilter before JwtAuthenticationFilter:
 *
 * http.addFilterBefore(rateLimitingFilter, JwtAuthenticationFilter.class);
 *
 *
 * SCHEDULED CLEANUP TASK:
 *
 * @Configuration
 * @EnableScheduling
 * public class ScheduledTasks {
 *
 *     @Autowired
 *     private RateLimitingFilter rateLimitingFilter;
 *
 *     @Scheduled(fixedRate = 3600000) // Every hour
 *     public void cleanupRateLimitCache() {
 *         rateLimitingFilter.cleanup();
 *     }
 * }
 *
 *
 * RESPONSE HEADERS:
 *
 * X-RateLimit-Limit: 5
 * X-RateLimit-Remaining: 3
 * X-RateLimit-Reset: 1698765432000
 *
 *
 * PRODUCTION REDIS IMPLEMENTATION:
 *
 * For multi-server deployments, use Redis:
 *
 * @Autowired
 * private RedisTemplate<String, String> redisTemplate;
 *
 * public boolean isRateLimitExceeded(String key, RateLimitConfig config) {
 *     String redisKey = "rate_limit:" + key;
 *     Long count = redisTemplate.opsForValue().increment(redisKey);
 *
 *     if (count == 1) {
 *         redisTemplate.expire(redisKey, config.getTimeWindow(), TimeUnit.MILLISECONDS);
 *     }
 *
 *     return count > config.getMaxRequests();
 * }
 */
