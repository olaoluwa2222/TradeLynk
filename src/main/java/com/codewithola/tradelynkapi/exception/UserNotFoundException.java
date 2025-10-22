package com.codewithola.tradelynkapi.exception;

/**
 * User Not Found Exception
 * Thrown when a requested user does not exist in the database
 * HTTP Status: 404 NOT FOUND
 */
public class UserNotFoundException extends ApplicationException {
    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(Long userId) {
        super("User not found with ID: " + userId);
    }

    public UserNotFoundException(String field, String value) {
        super(String.format("User not found with %s: %s", field, value));
    }
}