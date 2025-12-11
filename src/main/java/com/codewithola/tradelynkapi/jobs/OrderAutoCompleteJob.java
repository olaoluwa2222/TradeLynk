package com.codewithola.tradelynkapi.jobs;

import com.codewithola.tradelynkapi.services.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job to auto-complete orders that are pending delivery for more than 48 hours
 * Runs every 6 hours
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderAutoCompleteJob {

    private final OrderService orderService;

    /**
     * Auto-complete pending orders every 6 hours
     * Cron expression: "0 0 6 * * *"
            * - Second: 0
            * - Minute: 0
            * - Hour: Every 6 hours (0, 6, 12, 18)
     * - Day: Every day
     * - Month: Every month
     * - Day of week: Every day
     */
    @Scheduled(cron = "0 0 */6 * * *")
    public void autoCompleteOrders() {
        log.info("========================================");
        log.info("Starting auto-complete orders job");
        log.info("========================================");

        try {
            int completedCount = orderService.autoCompleteOrders();

            log.info("Auto-complete job completed successfully");
            log.info("Orders auto-completed: {}", completedCount);

        } catch (Exception e) {
            log.error("Error running auto-complete orders job", e);
        }

        log.info("========================================");
    }

    /**
     * Alternative: Run every day at 2 AM
     * Uncomment if you prefer daily execution
     */
    // @Scheduled(cron = "0 0 2 * * *")
    // public void autoCompleteOrdersDaily() {
    //     log.info("Running daily auto-complete orders job at 2 AM");
    //     orderService.autoCompleteOrders();
    // }
}