package com.tripplanner.exception;

/**
 * Thrown when a user exceeds their AI-generation quota. Mapped to
 * HTTP 429 Too Many Requests by {@link GlobalExceptionHandler}.
 */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
