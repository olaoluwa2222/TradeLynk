package com.codewithola.tradelynkapi.services;

import com.codewithola.tradelynkapi.dtos.requests.DisputeCreateRequest;
import com.codewithola.tradelynkapi.dtos.requests.DisputeResolveRequest;
import com.codewithola.tradelynkapi.dtos.response.DisputeDTO;
import com.codewithola.tradelynkapi.entity.Dispute;
import com.codewithola.tradelynkapi.entity.Order;
import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import com.codewithola.tradelynkapi.exception.NotFoundException;
import com.codewithola.tradelynkapi.repositories.DisputeRepository;
import com.codewithola.tradelynkapi.repositories.OrderRepository;
import com.codewithola.tradelynkapi.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * DisputeService handles buyer disputes and admin resolution
 * Core component of the escrow system
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final PaystackService paystackService;
    private final TransferService transferService;
    private final NotificationService notificationService;

    /**
     * Create a new dispute (buyer only)
     * Buyer can dispute if item not received or not as described
     */
    @Transactional
    public DisputeDTO createDispute(Long orderId, Long buyerId, DisputeCreateRequest request) {
        log.info("Buyer {} creating dispute for order {}", buyerId, orderId);

        // 1. Fetch order with details
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // 2. Validate buyer is the actual buyer of this order
        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new BadRequestException("Only the buyer can dispute this order");
        }

        // 3. Validate order can be disputed
        if (!order.canBeDisputed()) {
            throw new BadRequestException("Order cannot be disputed. Status: " + order.getStatus());
        }

        // 4. Check if dispute already exists
        if (disputeRepository.
                existsByOrderId(orderId)) {
            throw new BadRequestException("Dispute already exists for this order");
        }

        // 5. Fetch buyer user
        User buyer = order.getBuyer();

        // 6. Create dispute
        Dispute dispute = Dispute.builder()
                .order(order)
                .raisedBy(buyer)
                .reason(request.getReason())
                .description(request.getDescription())
                .status(Dispute.DisputeStatus.OPEN)
                .build();

        Dispute savedDispute = disputeRepository.save(dispute);

        // 7. Update order status to DISPUTED
        order.markAsDisputed();
        orderRepository.save(order);

        log.info("✅ Dispute created successfully. Dispute ID: {}", savedDispute.getId());

        // 8. Notify seller about dispute
        try {
            notificationService.sendDisputeNotification(
                    order.getSeller().getId(),
                    order.getItem().getTitle(),
                    request.getReason().getDisplayName()
            );
        } catch (Exception e) {
            log.error("Failed to send dispute notification", e);
        }

        return DisputeDTO.fromEntity(savedDispute);
    }

    /**
     * Resolve a dispute (admin only)
     * Admin can refund buyer, release to seller, or close without action
     */
    @Transactional
    public DisputeDTO resolveDispute(Long disputeId, Long adminId, DisputeResolveRequest request) {
        log.info("Admin {} resolving dispute {} with resolution: {}",
                adminId, disputeId, request.getResolution());

        // 1. Fetch dispute with details
        Dispute dispute = disputeRepository.findByIdWithDetails(disputeId)
                .orElseThrow(() -> new NotFoundException("Dispute not found"));

        // 2. Validate dispute can be resolved
        if (!dispute.canBeResolved()) {
            throw new BadRequestException("Dispute already resolved or closed");
        }

        // 3. Fetch admin user
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Admin not found"));

        // 4. Resolve dispute based on resolution type
        Order order = dispute.getOrder();

        switch (request.getResolution()) {
            case REFUND_BUYER:
                log.info("Resolution: REFUND_BUYER");
                refundBuyer(order);
                break;

            case RELEASE_TO_SELLER:
                log.info("Resolution: RELEASE_TO_SELLER");
                releaseToSeller(order);
                break;

            case NO_ACTION:
                log.info("Resolution: NO_ACTION (closing dispute)");
                // Just close dispute, no financial action
                break;

            default:
                throw new BadRequestException("Invalid resolution type");
        }

        // 5. Update dispute record
        dispute.resolve(admin, request.getResolution(), request.getAdminNotes());
        Dispute savedDispute = disputeRepository.save(dispute);

        log.info("✅ Dispute resolved successfully");

        // 6. Notify both parties about resolution
        notifyPartiesAboutResolution(dispute, request.getResolution());

        return DisputeDTO.fromEntity(savedDispute);
    }

    /**
     * Refund buyer via Paystack Refund API
     */
    private void refundBuyer(Order order) {
        log.info("Refunding buyer for order {}", order.getId());

        try {
            // Call Paystack Refund API
            paystackService.refundPayment(order.getPayment().getPaystackReference());

            // Update order status
            order.markAsRefunded();
            orderRepository.save(order);

            log.info("✅ Buyer refunded successfully");

        } catch (Exception e) {
            log.error("❌ Failed to refund buyer", e);
            throw new RuntimeException("Failed to refund buyer: " + e.getMessage());
        }
    }

    /**
     * Release payment to seller via Transfer API.
     * Marks order as COMPLETED directly (no DELIVERED intermediate step required).
     */
    private void releaseToSeller(Order order) {
        log.info("Releasing payment to seller for order {}", order.getId());

        try {
            // Mark order as completed (no longer requires DELIVERED intermediate step)
            if (!order.isCompleted()) {
                order.markAsCompleted();
                orderRepository.save(order);
            }

            // Initiate transfer to seller
            transferService.initiateTransfer(order.getId());

            log.info("✅ Payment released to seller successfully");

        } catch (Exception e) {
            log.error("❌ Failed to release payment to seller", e);
            throw new RuntimeException("Failed to release payment: " + e.getMessage());
        }
    }

    /**
     * Notify both buyer and seller about dispute resolution
     */
    private void notifyPartiesAboutResolution(Dispute dispute, Dispute.DisputeResolution resolution) {
        try {
            Order order = dispute.getOrder();
            String itemTitle = order.getItem().getTitle();

            // Notify buyer
            notificationService.sendDisputeResolutionNotification(
                    order.getBuyer().getId(),
                    itemTitle,
                    resolution.name(),
                    "buyer"
            );

            // Notify seller
            notificationService.sendDisputeResolutionNotification(
                    order.getSeller().getId(),
                    itemTitle,
                    resolution.name(),
                    "seller"
            );

        } catch (Exception e) {
            log.error("Failed to send resolution notifications", e);
        }
    }

    /**
     * Get dispute by ID
     */
    @Transactional(readOnly = true)
    public DisputeDTO getDisputeById(Long disputeId, Long userId) {
        Dispute dispute = disputeRepository.findByIdWithDetails(disputeId)
                .orElseThrow(() -> new NotFoundException("Dispute not found"));

        // Validate user has access (buyer, seller, or admin)
        if (!dispute.getRaisedBy().getId().equals(userId) &&
                !dispute.getOrder().getSeller().getId().equals(userId)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));
            if (!user.isAdmin()) {
                throw new BadRequestException("Access denied");
            }
        }

        return DisputeDTO.fromEntity(dispute);
    }

    /**
     * Get buyer's disputes
     */
    @Transactional(readOnly = true)
    public Page<DisputeDTO> getMyDisputes(Long buyerId, Pageable pageable) {
        Page<Dispute> disputes = disputeRepository.findByRaisedById(buyerId, pageable);
        return disputes.map(DisputeDTO::fromEntity);
    }

    /**
     * Get seller's disputes
     */
    @Transactional(readOnly = true)
    public Page<DisputeDTO> getSellerDisputes(Long sellerId, Pageable pageable) {
        Page<Dispute> disputes = disputeRepository.findBySellerId(sellerId, pageable);
        return disputes.map(DisputeDTO::fromEntity);
    }

    /**
     * Get all disputes (admin only)
     */
    @Transactional(readOnly = true)
    public Page<DisputeDTO> getAllDisputes(Pageable pageable, Dispute.DisputeStatus status) {
        Page<Dispute> disputes;

        if (status != null) {
            disputes = disputeRepository.findByStatus(status, pageable);
        } else {
            disputes = disputeRepository.findAllWithDetails(pageable);
        }

        return disputes.map(DisputeDTO::fromEntity);
    }

    /**
     * Get dispute statistics
     */
    @Transactional(readOnly = true)
    public DisputeStatistics getDisputeStatistics() {
        long totalDisputes = disputeRepository.count();
        long openDisputes = disputeRepository.countByStatus(Dispute.DisputeStatus.OPEN);
        long resolvedDisputes = disputeRepository.countByStatus(Dispute.DisputeStatus.RESOLVED);

        return DisputeStatistics.builder()
                .totalDisputes(totalDisputes)
                .openDisputes(openDisputes)
                .resolvedDisputes(resolvedDisputes)
                .build();
    }

    /**
     * Inner class for dispute statistics
     */
    @lombok.Data
    @lombok.Builder
    public static class DisputeStatistics {
        private long totalDisputes;
        private long openDisputes;
        private long resolvedDisputes;
    }
}