package com.codewithola.tradelynkapi.jobs;

import com.codewithola.tradelynkapi.services.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job for auto-completing orders
 * Runs daily to automatically complete orders that have been shipped for 5+ days
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderAutoCompleteJob {

    private final OrderService orderService;

    /**
     * Auto-complete orders that have been shipped for 5 days
     * Runs daily at 2:00 AM
     *
     * Cron format: second minute hour day month weekday
     * "0 0 2 * * *" = At 02:00:00 AM every day
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void autoCompleteOrders() {
        log.info("========== AUTO-COMPLETE JOB STARTED ==========");
        log.info("Checking for orders that need auto-completion (shipped 5+ days ago)");

        try {
            int completedCount = orderService.autoCompleteOrders();

            if (completedCount > 0) {
                log.info("✅ Successfully auto-completed {} order(s)", completedCount);
            } else {
                log.info("No orders to auto-complete");
            }

        } catch (Exception e) {
            log.error("❌ Error during auto-complete job", e);
        }

        log.info("========== AUTO-COMPLETE JOB FINISHED ==========");
    }

    /**
     * Test endpoint - runs auto-complete immediately
     * Remove or comment out in production
     * Uncomment for manual testing: @Scheduled(fixedDelay = Long.MAX_VALUE)
     */
    // @Scheduled(fixedDelay = Long.MAX_VALUE)
    public void manualTrigger() {
        log.info("Manual trigger of auto-complete job");
        autoCompleteOrders();
    }
}