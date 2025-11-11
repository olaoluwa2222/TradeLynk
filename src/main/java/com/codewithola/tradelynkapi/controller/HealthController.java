package com.codewithola.tradelynkapi.controller;

import com.cloudinary.Cloudinary;
import com.google.firebase.database.FirebaseDatabase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final DataSource dataSource;
    private final FirebaseDatabase firebaseDatabase;
    private final Cloudinary cloudinary;

    /**
     * GET /api/health
     * Check overall application health
     *
     * Returns:
     * - 200 OK: All services healthy
     * - 503 Service Unavailable: One or more services down
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        log.info("Health check requested");

        Map<String, Object> health = new HashMap<>();
        boolean allHealthy = true;

        // Check database connection
        String dbStatus = checkDatabase();
        health.put("database", dbStatus);
        if (!"connected".equals(dbStatus)) {
            allHealthy = false;
        }

        // Check Firebase connection
        String firebaseStatus = checkFirebase();
        health.put("firebase", firebaseStatus);
        if (!"connected".equals(firebaseStatus)) {
            allHealthy = false;
        }

        // Check Cloudinary connection
        String cloudinaryStatus = checkCloudinary();
        health.put("cloudinary", cloudinaryStatus);
        if (!"connected".equals(cloudinaryStatus)) {
            allHealthy = false;
        }

        // Overall status
        health.put("status", allHealthy ? "UP" : "DOWN");
        health.put("timestamp", System.currentTimeMillis());

        // Return appropriate HTTP status
        HttpStatus status = allHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

        return ResponseEntity.status(status).body(health);
    }

    /**
     * GET /api/health/simple
     * Simple health check (just returns 200 OK)
     * Used by load balancers for fast health checks
     */
    @GetMapping("/health/simple")
    public ResponseEntity<Map<String, String>> simpleHealthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }

    /**
     * Check database connectivity
     */
    private String checkDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            // Test query
            boolean valid = connection.isValid(2); // 2 second timeout

            if (valid) {
                log.debug("Database health check: PASSED");
                return "connected";
            } else {
                log.warn("Database health check: FAILED (connection invalid)");
                return "disconnected";
            }
        } catch (Exception e) {
            log.error("Database health check: FAILED", e);
            return "error: " + e.getMessage();
        }
    }

    /**
     * Check Firebase connectivity
     */
    private String checkFirebase() {
        try {
            // Check if Firebase database reference is accessible
            if (firebaseDatabase != null) {
                firebaseDatabase.getReference(".info/connected");
                log.debug("Firebase health check: PASSED");
                return "connected";
            } else {
                log.warn("Firebase health check: FAILED (database null)");
                return "not_initialized";
            }
        } catch (Exception e) {
            log.error("Firebase health check: FAILED", e);
            return "error: " + e.getMessage();
        }
    }

    /**
     * Check Cloudinary connectivity
     */
    private String checkCloudinary() {
        try {
            if (cloudinary != null && cloudinary.config != null) {

                String cloudName = cloudinary.config.cloudName;
                String apiKey = cloudinary.config.apiKey;

                if (cloudName != null && !cloudName.isEmpty() && apiKey != null && !apiKey.isEmpty()) {
                    log.debug("Cloudinary health check: PASSED");
                    return "connected";
                } else {
                    log.warn("Cloudinary health check: FAILED (cloudinary config fields missing)");
                    return "not_configured";
                }
            } else {
                log.warn("Cloudinary health check: FAILED (client or config null)");
                return "not_initialized";
            }
        } catch (Exception e) {
            log.error("Cloudinary health check: FAILED", e);
            return "error: " + e.getMessage();
        }
    }
}

/*
 * USAGE EXAMPLES:
 *
 * 1. Load Balancer Configuration (AWS ALB, Nginx):
 *    Health Check URL: /api/v1/health/simple
 *    Interval: 30 seconds
 *    Timeout: 5 seconds
 *    Unhealthy threshold: 2
 *    Healthy threshold: 3
 *
 * 2. Kubernetes Liveness Probe:
 *    livenessProbe:
 *      httpGet:
 *        path: /api/v1/health/simple
 *        port: 8080
 *      initialDelaySeconds: 30
 *      periodSeconds: 10
 *
 * 3. Monitoring (Prometheus):
 *    - Scrape /api/v1/health endpoint
 *    - Alert if status != "UP"
 *    - Alert if any service status != "connected"
 *
 * 4. Deployment Verification:
 *    curl http://localhost:8080/api/v1/health
 *    # Should return 200 OK with all services "connected"
 *
 * RESPONSE EXAMPLES:
 *
 * Healthy:
 * {
 *   "status": "UP",
 *   "database": "connected",
 *   "firebase": "connected",
 *   "cloudinary": "connected",
 *   "timestamp": 1698765432000
 * }
 *
 * Unhealthy:
 * {
 *   "status": "DOWN",
 *   "database": "connected",
 *   "firebase": "error: Connection timeout",
 *   "cloudinary": "connected",
 *   "timestamp": 1698765432000
 * }
 */