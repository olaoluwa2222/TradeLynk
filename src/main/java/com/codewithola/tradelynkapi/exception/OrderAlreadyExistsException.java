package com.codewithola.tradelynkapi.exception;

/**
 * Exception thrown when trying to create an order for an already completed payment
 */
public class OrderAlreadyExistsException extends RuntimeException {
    public OrderAlreadyExistsException(String message) {
        super(message);
    }

    public OrderAlreadyExistsException(Long paymentId) {
        super("An order already exists for payment ID " + paymentId);
    }
}