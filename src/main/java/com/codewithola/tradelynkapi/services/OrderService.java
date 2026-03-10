package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.response.OrderDTO;
import com.codewithola.tradelynkapi.entity.Item;
import com.codewithola.tradelynkapi.entity.Order;
import com.codewithola.tradelynkapi.entity.Payment;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.*;
import com.codewithola.tradelynkapi.repositories.ItemRepository;
import com.codewithola.tradelynkapi.repositories.OrderRepository;
import com.codewithola.tradelynkapi.repositories.PaymentRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * OrderService — Direct Payment Flow (no escrow).
 * Orders are created with status PAID immediately after payment succeeds.
 * Sellers receive 100% of the payment (Paystack fees handled by Paystack separately).
 * No buyer confirmation required — orders auto-complete after delivery window.
 */
@Service
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final TransferService transferService;

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        ItemRepository itemRepository,
                        UserRepository userRepository,
                        PaymentRepository paymentRepository,
                        NotificationService notificationService,
                        @Lazy TransferService transferService) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        this.transferService = transferService;
    }

    /**
     * Create an order after successful payment.
     * Order starts with status PAID — seller receives funds directly via Paystack.
     */
    @Transactional
    public OrderDTO createOrder(Long itemId, Long buyerId, Long sellerId, Long paymentId,
                                Long amount, String deliveryAddress) {
        log.info("Creating order for item: {}, buyer: {}, seller: {}, payment: {}",
                itemId, buyerId, sellerId, paymentId);

        // 1. Validate that order doesn't already exist for this payment
        orderRepository.findByPaymentId(paymentId).ifPresent(existingOrder -> {
            throw new OrderAlreadyExistsException(paymentId);
        });

        // 2. Fetch and validate item
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found"));

        if (item.getQuantity() < 1) {
            throw new BadRequestException("Item is out of stock");
        }

        // 3. Fetch buyer and seller
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new NotFoundException("Buyer not found"));

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found"));

        // 4. Fetch payment and verify it's successful
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));

        if (payment.getStatus() != Payment.PaymentStatus.SUCCESS) {
            throw new BadRequestException("Payment is not successful. Cannot create order.");
        }

        // 5. Decrement item quantity
        item.setQuantity(item.getQuantity() - 1);

        // 6. Update item status if quantity reaches zero
        if (item.getQuantity() == 0) {
            item.setStatus(Item.Status.SOLD);
            log.info("Item {} is now SOLD (quantity reached 0)", itemId);
        }

        itemRepository.save(item);

        // 7. Create order with PAID status (direct payment — no escrow)
        Order order = Order.builder()
                .item(item)
                .buyer(buyer)
                .seller(seller)
                .payment(payment)
                .amount(amount)
                .deliveryAddress(deliveryAddress)
                .status(Order.OrderStatus.PAID)
                .build();

        Order savedOrder = orderRepository.save(order);

        log.info("✅ Order created. Order ID: {}, Status: PAID", savedOrder.getId());

        // 8. Notify seller about new order — "A buyer has paid. Arrange delivery and mark as Shipped."
        try {
            notificationService.sendNewOrderNotification(sellerId, item.getTitle(), amount);
        } catch (Exception e) {
            log.error("Failed to send new order notification to seller", e);
        }

        // 9. Notify buyer — "Your order has been placed and is being prepared for delivery."
        try {
            notificationService.sendBuyerOrderPlacedNotification(buyerId, item.getTitle(), amount);
        } catch (Exception e) {
            log.error("Failed to send order placed notification to buyer", e);
        }

        return OrderDTO.fromEntity(savedOrder);
    }

    /**
     * Mark order as shipped (seller only).
     */
    @Transactional
    public OrderDTO markAsShipped(Long orderId, Long sellerId) {
        log.info("Seller {} marking order {} as shipped", sellerId, orderId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!order.getSeller().getId().equals(sellerId)) {
            throw new OrderAccessDeniedException("Only the seller can mark order as shipped");
        }

        if (!order.canBeShipped()) {
            throw new BadRequestException("Order cannot be marked as shipped. Status: " + order.getStatus());
        }

        order.markAsShipped();
        Order savedOrder = orderRepository.save(order);

        log.info("✅ Order {} marked as shipped", orderId);

        try {
            notificationService.sendShippedNotification(
                    order.getBuyer().getId(),
                    order.getItem().getTitle(),
                    order.getDeliveryAddress()
            );
        } catch (Exception e) {
            log.error("Failed to send shipped notification", e);
        }

        return OrderDTO.fromEntity(savedOrder);
    }

    /**
     * Confirm delivery (buyer action) — no longer required.
     * Kept as a no-op endpoint for backwards compatibility.
     * Simply marks the order as COMPLETED and triggers payout.
     */
    @Transactional
    public OrderDTO markAsDelivered(Long orderId, Long buyerId) {
        log.info("Buyer {} called confirm-delivery for order {} — completing order directly", buyerId, orderId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new OrderAccessDeniedException("Access denied");
        }

        // If already completed, just return
        if (order.isCompleted() || order.isFinalState()) {
            log.info("Order {} is already in final state: {}", orderId, order.getStatus());
            return OrderDTO.fromEntity(order);
        }

        // Complete the order directly — no DELIVERED intermediate step
        order.markAsCompleted();
        Order savedOrder = orderRepository.save(order);
        log.info("✅ Order {} completed via buyer confirm-delivery action", orderId);

        // Trigger payout to seller
        triggerPayoutForOrder(savedOrder);

        return OrderDTO.fromEntity(savedOrder);
    }

    /**
     * Cancel an order — can be done by buyer or seller (only for PAID or SHIPPED orders).
     */
    @Transactional
    public OrderDTO cancelOrder(Long orderId, Long userId, String reason) {
        log.info("User {} cancelling order {} with reason: {}", userId, orderId, reason);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!order.getBuyer().getId().equals(userId) &&
                !order.getSeller().getId().equals(userId)) {
            throw new OrderAccessDeniedException();
        }

        if (!order.canBeCancelled()) {
            throw new BadRequestException("Order cannot be cancelled. Status: " + order.getStatus());
        }

        order.cancel(reason);

        // Restore item quantity
        Item item = order.getItem();
        item.setQuantity(item.getQuantity() + 1);

        if (item.getStatus() == Item.Status.SOLD) {
            item.setStatus(Item.Status.ACTIVE);
            log.info("Item {} status restored to ACTIVE", item.getId());
        }

        itemRepository.save(item);
        Order savedOrder = orderRepository.save(order);

        log.info("Order {} cancelled successfully", orderId);

        Long notifyUserId = userId.equals(order.getBuyer().getId())
                ? order.getSeller().getId()
                : order.getBuyer().getId();

        try {
            notificationService.sendOrderCancellationNotification(
                    notifyUserId,
                    order.getItem().getTitle(),
                    reason
            );
        } catch (Exception e) {
            log.error("Failed to send cancellation notification", e);
        }

        return OrderDTO.fromEntity(savedOrder);
    }

    /**
     * Auto-complete orders that have been SHIPPED for 5+ days.
     * Marks as COMPLETED and triggers payout to seller.
     * Called by scheduled job.
     */
    @Transactional
    public int autoCompleteOrders() {
        log.info("Running auto-complete job for pending orders");

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(5);

        List<Order> pendingOrders = orderRepository.findByCreatedAtBeforeAndStatus(
                cutoffDate,
                Order.OrderStatus.SHIPPED
        );

        log.info("Found {} orders to auto-complete", pendingOrders.size());

        int completedCount = 0;

        for (Order order : pendingOrders) {
            try {
                order.autoComplete();
                orderRepository.save(order);

                log.info("Auto-completed order: {}", order.getId());

                // Notify both parties
                notificationService.sendAutoCompletionNotification(
                        order.getBuyer().getId(),
                        order.getSeller().getId(),
                        order.getItem().getTitle()
                );

                // Trigger payout to seller
                triggerPayoutForOrder(order);

                completedCount++;

            } catch (Exception e) {
                log.error("Failed to auto-complete order: {}", order.getId(), e);
            }
        }

        log.info("✅ Auto-completed {} orders", completedCount);
        return completedCount;
    }

    /**
     * Trigger Paystack payout to seller for a completed order.
     * Logs failure and flags for manual review — does NOT block order completion.
     */
    private void triggerPayoutForOrder(Order order) {
        try {
            transferService.initiateTransfer(order.getId());
            log.info("✅ Payout triggered for order: {}", order.getId());
        } catch (Exception e) {
            log.error("❌ Payout FAILED for order {}. Flagged for manual review. Error: {}",
                    order.getId(), e.getMessage(), e);
            // Do NOT throw — order completion must not be blocked by payout failure
        }
    }

    /**
     * Get buyer's purchase history (paginated)
     */
    @Transactional(readOnly = true)
    public Page<OrderDTO> getMyPurchases(Long buyerId, Pageable pageable) {
        log.info("Fetching purchases for buyer: {}", buyerId);
        Page<Order> orders = orderRepository.findByBuyerId(buyerId, pageable);
        return orders.map(OrderDTO::fromEntity);
    }

    /**
     * Get seller's sales history (paginated)
     */
    @Transactional(readOnly = true)
    public Page<OrderDTO> getMySales(Long sellerId, Pageable pageable) {
        log.info("Fetching sales for seller: {}", sellerId);
        Page<Order> orders = orderRepository.findBySellerId(sellerId, pageable);
        return orders.map(OrderDTO::fromEntity);
    }

    /**
     * Get order details by ID.
     * Validates that the requesting user is either buyer or seller.
     */
    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long orderId, Long userId) {
        log.info("Fetching order: {} for user: {}", orderId, userId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!order.getBuyer().getId().equals(userId) &&
                !order.getSeller().getId().equals(userId)) {
            throw new OrderAccessDeniedException();
        }

        return OrderDTO.fromEntity(order);
    }

    /**
     * Get order statistics for a user
     */
    @Transactional(readOnly = true)
    public OrderStatistics getOrderStatistics(Long userId) {
        long totalPurchases = orderRepository.countByBuyerId(userId);
        long totalSales = orderRepository.countBySellerId(userId);

        return OrderStatistics.builder()
                .totalPurchases(totalPurchases)
                .totalSales(totalSales)
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class OrderStatistics {
        private long totalPurchases;
        private long totalSales;
    }
}

