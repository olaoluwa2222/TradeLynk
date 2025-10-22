package com.codewithola.tradelynkapi.exception;

/**
 * Invalid Credentials Exception
 * Thrown when login credentials are incorrect
 * HTTP Status: 401 UNAUTHORIZED
 */
public class InvalidCredentialsException extends ApplicationException {
  public InvalidCredentialsException() {
    super("Invalid email or password");
  }

  public InvalidCredentialsException(String message) {
    super(message);
  }
}