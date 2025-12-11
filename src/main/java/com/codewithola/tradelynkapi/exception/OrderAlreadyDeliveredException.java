package com.codewithola.tradelynkapi.exception;

/**
 * Exception thrown when trying to modify an order that's already delivered
 */
public class OrderAlreadyDeliveredException extends RuntimeException {
    public OrderAlreadyDeliveredException(String message) {
        super(message);
    }

    public OrderAlreadyDeliveredException() {
        super("This order has already been delivered and cannot be modified");
    }
}