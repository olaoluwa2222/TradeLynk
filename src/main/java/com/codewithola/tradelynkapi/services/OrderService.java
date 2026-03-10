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
import java.util.ArrayList;
import java.util.List;

/**
 * OrderService — Direct Payment Flow (Paystack split payments).
 * Sellers receive their share automatically when the buyer pays at checkout.
 * There is NO separate payout/transfer step at delivery.
 * Flow: PAID → SHIPPED → COMPLETED (buyer confirms or auto-completes after 5 days)
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

    /**
     * Create an order after successful Paystack payment.
     * Order starts with status PAID. Seller already received their split via Paystack.
     */
    @Transactional
    public OrderDTO createOrder(Long itemId, Long buyerId, Long sellerId, Long paymentId,
                                Long amount, String deliveryAddress) {
        log.info("Creating order — item: {}, buyer: {}, seller: {}, payment: {}",
                itemId, buyerId, sellerId, paymentId);

        // 1. Idempotent: do not create a duplicate order for the same payment
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

        // 4. Fetch payment and verify it succeeded
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));

        if (payment.getStatus() != Payment.PaymentStatus.SUCCESS) {
            throw new BadRequestException("Payment is not successful. Cannot create order.");
        }

        // 5. Decrement item stock
        item.setQuantity(item.getQuantity() - 1);
        if (item.getQuantity() == 0) {
            item.setStatus(Item.Status.SOLD);
            log.info("Item {} is now SOLD (stock = 0)", itemId);
        }
        itemRepository.save(item);

        // 6. Create order with PAID status
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
        log.info("✅ Order {} created. Status: PAID", savedOrder.getId());

        // 7. Notify seller
        try {
            notificationService.sendNewOrderNotification(sellerId, item.getTitle(), amount);
        } catch (Exception e) {
            log.error("Failed to notify seller of new order", e);
        }

        // 8. Notify buyer
        try {
            notificationService.sendBuyerOrderPlacedNotification(buyerId, item.getTitle(), amount);
        } catch (Exception e) {
            log.error("Failed to notify buyer of order placement", e);
        }

        return OrderDTO.fromEntity(savedOrder);
    }

    /**
     * Seller marks order as shipped.
     * Transition: PAID → SHIPPED
     */
    @Transactional
    public OrderDTO markAsShipped(Long orderId, Long sellerId) {
        log.info("Seller {} marking order {} as shipped", sellerId, orderId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!order.getSeller().getId().equals(sellerId)) {
            throw new OrderAccessDeniedException("Only the seller can mark an order as shipped");
        }

        if (!order.canBeShipped()) {
            throw new BadRequestException(
                    "Order cannot be shipped. Current status: " + order.getStatus()
                    + ". Must be PAID.");
        }

        order.markAsShipped();
        Order savedOrder = orderRepository.save(order);
        log.info("✅ Order {} marked as SHIPPED", orderId);

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
     * Buyer confirms they received the order ("I Received This" / confirm-delivery).
     * Transition: SHIPPED → COMPLETED
     *
     * Uses Paystack split payments — seller already received their funds at checkout.
     * No payout or transfer call here. Just mark complete and return.
     */
    @Transactional
    public OrderDTO markAsDelivered(Long orderId, Long buyerId) {
        log.info("Buyer {} confirming delivery for order {}", buyerId, orderId);

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        // 1. Validate buyer owns this order
        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new OrderAccessDeniedException("Only the buyer can confirm delivery");
        }

        // 2. Idempotent: already completed → just return
        if (order.isCompleted() || order.isFinalState()) {
            log.info("Order {} is already in final state: {} — returning as-is", orderId, order.getStatus());
            return OrderDTO.fromEntity(order);
        }

        // 3. Set status to COMPLETED and record completedAt timestamp
        order.markAsCompleted();
        Order savedOrder = orderRepository.save(order);
        log.info("✅ Order {} marked as COMPLETED by buyer {}", orderId, buyerId);

        // 4. Notify seller (no transfer — Paystack split already handled the funds)
        try {
            notificationService.sendDeliveryConfirmationNotification(
                    savedOrder.getSeller().getId(),
                    savedOrder.getItem().getTitle()
            );
        } catch (Exception e) {
            log.error("Failed to send delivery confirmation notification", e);
        }

        return OrderDTO.fromEntity(savedOrder);
    }

    /**
     * Cancel an order (buyer or seller, only when PAID or SHIPPED).
     */
    @Transactional
    public OrderDTO cancelOrder(Long orderId, Long userId, String reason) {
        log.info("User {} cancelling order {} — reason: {}", userId, orderId, reason);

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

        // Restore item stock
        Item item = order.getItem();
        item.setQuantity(item.getQuantity() + 1);
        if (item.getStatus() == Item.Status.SOLD) {
            item.setStatus(Item.Status.ACTIVE);
            log.info("Item {} status restored to ACTIVE", item.getId());
        }
        itemRepository.save(item);

        Order savedOrder = orderRepository.save(order);
        log.info("Order {} cancelled", orderId);

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
     * Auto-complete orders older than 5 days that are still SHIPPED or DELIVERED.
     * Marks them COMPLETED. No transfer/payout — Paystack split already settled.
     * Called by the scheduled job (daily at 2 AM).
     */
    @Transactional
    public int autoCompleteOrders() {
        log.info("Running auto-complete job");

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(5);

        List<Order> shippedOrders = orderRepository.findByCreatedAtBeforeAndStatus(
                cutoffDate, Order.OrderStatus.SHIPPED);
        List<Order> deliveredOrders = orderRepository.findByCreatedAtBeforeAndStatus(
                cutoffDate, Order.OrderStatus.DELIVERED);

        List<Order> toComplete = new ArrayList<>();
        toComplete.addAll(shippedOrders);
        toComplete.addAll(deliveredOrders);

        log.info("Found {} orders to auto-complete ({} SHIPPED, {} DELIVERED)",
                toComplete.size(), shippedOrders.size(), deliveredOrders.size());

        int count = 0;
        for (Order order : toComplete) {
            try {
                order.autoComplete();
                orderRepository.save(order);
                log.info("Auto-completed order {}", order.getId());

                notificationService.sendAutoCompletionNotification(
                        order.getBuyer().getId(),
                        order.getSeller().getId(),
                        order.getItem().getTitle()
                );

                // No transfer call — Paystack split payments already settled to seller.
                count++;
            } catch (Exception e) {
                log.error("Failed to auto-complete order {}", order.getId(), e);
            }
        }

        log.info("✅ Auto-completed {} orders", count);
        return count;
    }

    // ── Read-only queries ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<OrderDTO> getMyPurchases(Long buyerId, Pageable pageable) {
        return orderRepository.findByBuyerId(buyerId, pageable).map(OrderDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO> getMySales(Long sellerId, Pageable pageable) {
        return orderRepository.findBySellerId(sellerId, pageable).map(OrderDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!order.getBuyer().getId().equals(userId) &&
                !order.getSeller().getId().equals(userId)) {
            throw new OrderAccessDeniedException();
        }

        return OrderDTO.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public OrderStatistics getOrderStatistics(Long userId) {
        return OrderStatistics.builder()
                .totalPurchases(orderRepository.countByBuyerId(userId))
                .totalSales(orderRepository.countBySellerId(userId))
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class OrderStatistics {
        private long totalPurchases;
        private long totalSales;
    }
}
