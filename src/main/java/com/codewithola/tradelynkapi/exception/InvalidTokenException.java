package com.codewithola.tradelynkapi.exception;

/**
 * Thrown when a verification token is invalid or expired.
 */
public class InvalidTokenException extends ApplicationException {

    public InvalidTokenException() {
        super("Invalid or expired verification token");
    }

    public InvalidTokenException(String message) {
        super(message);
    }
}
