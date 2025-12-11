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

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    /**
     * Create an order after successful payment
     * This is called either manually or automatically after payment verification
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

        // 7. Create order
        Order order = Order.builder()
                .item(item)
                .buyer(buyer)
                .seller(seller)
                .payment(payment)
                .amount(amount)
                .deliveryAddress(deliveryAddress)
                .status(Order.OrderStatus.PENDING_DELIVERY)
                .build();

        Order savedOrder = orderRepository.save(order);

        log.info("Order created successfully. Order ID: {}", savedOrder.getId());

        // 8. Send notification to seller about new order
        try {
            notificationService.sendNewOrderNotification(sellerId, item.getTitle(), amount);
        } catch (Exception e) {
            log.error("Failed to send new order notification to seller", e);
            // Don't fail the order creation if notification fails
        }

        return OrderDTO.fromEntity(savedOrder);
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
     * Mark order as delivered (only buyer can do this)
     */
    @Transactional
    public OrderDTO markAsDelivered(Long orderId, Long buyerId) {
        log.info("Buyer {} marking order {} as delivered", buyerId, orderId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Validate that user is the buyer
        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new OrderAccessDeniedException("Only the buyer can mark order as delivered");
        }

        // Validate that order is pending delivery
        if (!order.canBeMarkedAsDelivered()) {
            throw new OrderAlreadyDeliveredException("Order cannot be marked as delivered");
        }

        // Mark as delivered
        order.markAsDelivered();
        Order savedOrder = orderRepository.save(order);

        log.info("Order {} marked as delivered", orderId);

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
     * Can be done by buyer or seller (but only for PENDING_DELIVERY orders)
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
            throw new BadRequestException("Order cannot be cancelled (already delivered or cancelled)");
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
     * Auto-complete orders that are pending delivery for more than 48 hours
     * This is called by a scheduled job
     */
    @Transactional
    public int autoCompleteOrders() {
        log.info("Running auto-complete job for pending orders");

        // Find orders older than 48 hours
        LocalDateTime cutoffDate = LocalDateTime.now().minusHours(48);

        List<Order> pendingOrders = orderRepository.findByCreatedAtBeforeAndStatus(
                cutoffDate,
                Order.OrderStatus.PENDING_DELIVERY
        );

        log.info("Found {} orders to auto-complete", pendingOrders.size());

        int completedCount = 0;

        for (Order order : pendingOrders) {
            try {
                order.autoComplete();
                orderRepository.save(order);
                completedCount++;

                log.info("Auto-completed order: {}", order.getId());

                // Notify buyer and seller about auto-completion
                notificationService.sendAutoCompletionNotification(
                        order.getBuyer().getId(),
                        order.getSeller().getId(),
                        order.getItem().getTitle()
                );

            } catch (Exception e) {
                log.error("Failed to auto-complete order: {}", order.getId(), e);
            }
        }

        log.info("Auto-completed {} orders", completedCount);

        return completedCount;
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