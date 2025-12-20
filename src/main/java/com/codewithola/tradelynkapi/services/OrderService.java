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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * UPDATED OrderService with Escrow Flow
 * KEY CHANGES:
 * 1. Orders created with status PAYMENT_HELD (not PENDING_DELIVERY)
 * 2. Added markAsShipped() for seller
 * 3. Updated markAsDelivered() to trigger transfer to seller
 * 4. Changed auto-complete from 48 hours to 5 days
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final TransferService transferService;

    /**
     * ✅ UPDATED: Create an order after successful payment
     * Order starts with status PAYMENT_HELD (money in escrow)
     */
    @Transactional
    public OrderDTO createOrder(Long itemId, Long buyerId, Long sellerId, Long paymentId,
                                Long amount, String deliveryAddress) {
        log.info("🔒 Creating ESCROW order for item: {}, buyer: {}, seller: {}, payment: {}",
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

        // 7. ✅ UPDATED: Create order with PAYMENT_HELD status (escrow)
        Order order = Order.builder()
                .item(item)
                .buyer(buyer)
                .seller(seller)
                .payment(payment)
                .amount(amount)
                .deliveryAddress(deliveryAddress)
                .status(Order.OrderStatus.PAYMENT_HELD)  // ✅ CHANGED from PENDING_DELIVERY
                .build();

        Order savedOrder = orderRepository.save(order);

        log.info("✅ Escrow order created successfully. Order ID: {}, Status: PAYMENT_HELD", savedOrder.getId());

        // 8. Send notification to seller about new order
        try {
            notificationService.sendNewOrderNotification(sellerId, item.getTitle(), amount);
        } catch (Exception e) {
            log.error("Failed to send new order notification to seller", e);
        }

        return OrderDTO.fromEntity(savedOrder);
    }

    /**
     * ✅ NEW: Mark order as shipped (seller only)
     * Seller confirms they've shipped the item
     */
    @Transactional
    public OrderDTO markAsShipped(Long orderId, Long sellerId) {
        log.info("📦 Seller {} marking order {} as shipped", sellerId, orderId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Validate that user is the seller
        if (!order.getSeller().getId().equals(sellerId)) {
            throw new OrderAccessDeniedException("Only the seller can mark order as shipped");
        }

        // Validate that order can be shipped
        if (!order.canBeShipped()) {
            throw new BadRequestException("Order cannot be marked as shipped. Status: " + order.getStatus());
        }

        // Mark as shipped
        order.markAsShipped();
        Order savedOrder = orderRepository.save(order);

        log.info("✅ Order {} marked as shipped", orderId);

        // Notify buyer about shipment
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
     * ✅ UPDATED: Mark order as delivered (buyer only)
     * This triggers TRANSFER to seller (money released from escrow)
     */
    @Transactional
    public OrderDTO markAsDelivered(Long orderId, Long buyerId) {
        log.info("✅ Buyer {} confirming delivery for order {}", buyerId, orderId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Validate that user is the buyer
        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new OrderAccessDeniedException("Only the buyer can mark order as delivered");
        }

        // Validate that order can be marked as delivered
        if (!order.canBeMarkedAsDelivered()) {
            throw new BadRequestException("Order cannot be marked as delivered. Status: " + order.getStatus());
        }

        // Mark as delivered
        order.markAsDelivered();
        Order savedOrder = orderRepository.save(order);

        log.info("✅ Order {} marked as delivered", orderId);

        // ✅ NEW: Initiate transfer to seller (release escrow)
        try {
            log.info("💰 Releasing escrow funds to seller...");
            transferService.initiateTransfer(orderId);
            log.info("✅ Escrow funds released successfully");
        } catch (Exception e) {
            log.error("❌ Failed to release escrow funds", e);
            // Don't fail the order - admin can manually trigger transfer later
        }

        // Notify seller about delivery confirmation
        try {
            notificationService.sendDeliveryConfirmationNotification(
                    order.getSeller().getId(),
                    order.getItem().getTitle()
            );
        } catch (Exception e) {
            log.error("Failed to send delivery confirmation notification", e);
        }

        return OrderDTO.fromEntity(savedOrder);
    }

    /**
     * Cancel an order
     * Can be done by buyer or seller (but only for PAYMENT_HELD or SHIPPED orders)
     */
    @Transactional
    public OrderDTO cancelOrder(Long orderId, Long userId, String reason) {
        log.info("User {} cancelling order {} with reason: {}", userId, orderId, reason);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Validate that user is buyer or seller
        if (!order.getBuyer().getId().equals(userId) &&
                !order.getSeller().getId().equals(userId)) {
            throw new OrderAccessDeniedException();
        }

        // Validate that order can be cancelled
        if (!order.canBeCancelled()) {
            throw new BadRequestException("Order cannot be cancelled. Status: " + order.getStatus());
        }

        // Cancel order
        order.cancel(reason);

        // Restore item quantity
        Item item = order.getItem();
        item.setQuantity(item.getQuantity() + 1);

        // If item was SOLD, restore to ACTIVE
        if (item.getStatus() == Item.Status.SOLD) {
            item.setStatus(Item.Status.ACTIVE);
            log.info("Item {} status restored to ACTIVE", item.getId());
        }

        itemRepository.save(item);
        Order savedOrder = orderRepository.save(order);

        log.info("Order {} cancelled successfully", orderId);

        // Notify the other party about cancellation
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
     * ✅ UPDATED: Auto-complete orders after 5 DAYS (was 48 hours)
     * Automatically marks as delivered and releases funds to seller
     * This is called by a scheduled job
     */
    @Transactional
    public int autoCompleteOrders() {
        log.info("🤖 Running auto-complete job for pending orders");

        // ✅ CHANGED: Find orders older than 5 DAYS (was 48 hours)
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(5);

        List<Order> pendingOrders = orderRepository.findByCreatedAtBeforeAndStatus(
                cutoffDate,
                Order.OrderStatus.SHIPPED  // ✅ CHANGED: Only auto-complete SHIPPED orders
        );

        log.info("Found {} orders to auto-complete", pendingOrders.size());

        int completedCount = 0;

        for (Order order : pendingOrders) {
            try {
                // Mark as delivered (auto-completed)
                order.autoComplete();
                orderRepository.save(order);

                log.info("Auto-completed order: {}", order.getId());

                // ✅ NEW: Initiate transfer to seller
                try {
                    transferService.initiateTransfer(order.getId());
                    log.info("✅ Escrow funds released for auto-completed order: {}", order.getId());
                } catch (Exception e) {
                    log.error("Failed to release funds for auto-completed order: {}", order.getId(), e);
                }

                // Notify buyer and seller about auto-completion
                notificationService.sendAutoCompletionNotification(
                        order.getBuyer().getId(),
                        order.getSeller().getId(),
                        order.getItem().getTitle()
                );

                completedCount++;

            } catch (Exception e) {
                log.error("Failed to auto-complete order: {}", order.getId(), e);
            }
        }

        log.info("✅ Auto-completed {} orders", completedCount);

        return completedCount;
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
     * Get order details by ID
     * Validates that the requesting user is either buyer or seller
     */
    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long orderId, Long userId) {
        log.info("Fetching order: {} for user: {}", orderId, userId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Validate that user is either buyer or seller
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

    /**
     * Inner class for order statistics
     */
    @lombok.Data
    @lombok.Builder
    public static class OrderStatistics {
        private long totalPurchases;
        private long totalSales;
    }
}