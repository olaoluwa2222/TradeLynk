package com.codewithola.tradelynkapi.exception;


/**
 * Unauthorized Access Exception
 * Thrown when user attempts to access resources without proper authorization
 * HTTP Status: 403 FORBIDDEN
 */
public class UnauthorizedAccessException extends ApplicationException {
    public UnauthorizedAccessException() {
        super("You do not have permission to access this resource");
    }

    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
