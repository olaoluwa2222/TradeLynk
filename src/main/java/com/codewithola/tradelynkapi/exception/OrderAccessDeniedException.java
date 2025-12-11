package com.codewithola.tradelynkapi.exception;

/**
 * Exception thrown when a user tries to access an order they don't own
 */
public class OrderAccessDeniedException extends RuntimeException {
    public OrderAccessDeniedException(String message) {
        super(message);
    }

    public OrderAccessDeniedException() {
        super("You don't have permission to access this order");
    }
}