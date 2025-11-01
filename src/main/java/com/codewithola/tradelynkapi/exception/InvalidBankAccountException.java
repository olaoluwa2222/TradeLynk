package com.codewithola.tradelynkapi.exception;

public class InvalidBankAccountException extends RuntimeException {
    public InvalidBankAccountException(String message) {
        super(message);
    }
}
