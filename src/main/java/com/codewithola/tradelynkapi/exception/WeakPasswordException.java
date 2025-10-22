package com.codewithola.tradelynkapi.exception;

/**
 * Weak Password Exception
 * Thrown when password doesn't meet security requirements
 * HTTP Status: 400 BAD REQUEST
 */
public class WeakPasswordException extends ApplicationException {
    public WeakPasswordException() {
        super("Password must be at least 8 characters long and contain uppercase, lowercase, and numbers");
    }

    public WeakPasswordException(String message) {
        super(message);
    }
}