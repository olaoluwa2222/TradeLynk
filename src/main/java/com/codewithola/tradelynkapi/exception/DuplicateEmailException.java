package com.codewithola.tradelynkapi.exception;

/**
 * Duplicate Email Exception
 * Thrown when attempting to register with an existing email
 * HTTP Status: 409 CONFLICT
 */
public class DuplicateEmailException extends ApplicationException {
    public DuplicateEmailException(String email) {
        super("An account already exists with email: " + email);
    }
}
