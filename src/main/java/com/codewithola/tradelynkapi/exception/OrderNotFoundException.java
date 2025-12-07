package com.codewithola.tradelynkapi.exception;

/**
 * Exception thrown when an order is not found
 */
public class OrderNotFoundException extends RuntimeException {
  public OrderNotFoundException(String message) {
    super(message);
  }

  public OrderNotFoundException(Long orderId) {
    super("Order with ID " + orderId + " not found");
  }
}