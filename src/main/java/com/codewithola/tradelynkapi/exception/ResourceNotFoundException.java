package com.codewithola.tradelynkapi.exception;

/**
 * Resource Not Found Exception
 * Generic exception for any resource that cannot be found
 * HTTP Status: 404 NOT FOUND
 */
public class ResourceNotFoundException extends ApplicationException {
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
