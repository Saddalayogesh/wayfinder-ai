package com.tripplanner.exception;

/**
 * Thrown when registration is attempted with an email that is already in use.
 * Mapped to HTTP 409 Conflict by {@link GlobalExceptionHandler}.
 */
public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
