package com.codewithola.tradelynkapi.exception;

/**
 * Account Not Active Exception
 * Thrown when attempting to access a deactivated account
 * HTTP Status: 403 FORBIDDEN
 */
public class AccountNotActiveException extends ApplicationException {
    public AccountNotActiveException() {
        super("This account has been deactivated. Please contact support.");
    }

    public AccountNotActiveException(String message) {
        super(message);
    }
}