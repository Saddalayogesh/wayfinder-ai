package com.tripplanner.exception;

/**
 * Raised when an external dependency (Gemini, a Places provider) is
 * unreachable or times out — mapped to HTTP 503 by
 * {@link GlobalExceptionHandler}. Distinct from {@link ItineraryGenerationException}
 * (502), which covers the dependency responding but unusably.
 */
public class ServiceUnavailableException extends RuntimeException {

    public ServiceUnavailableException(String message) {
        super(message);
    }
}
