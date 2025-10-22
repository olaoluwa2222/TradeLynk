package com.codewithola.tradelynkapi.exception;

/**
 * Invalid Email Format Exception
 * Thrown when email doesn't match required format (@landmark.edu.ng)
 * HTTP Status: 400 BAD REQUEST
 */
public class InvalidEmailFormatException extends ApplicationException {
    public InvalidEmailFormatException() {
        super("Email must be a valid Landmark University email (@landmark.edu.ng)");
    }

    public InvalidEmailFormatException(String message) {
        super(message);
    }
}