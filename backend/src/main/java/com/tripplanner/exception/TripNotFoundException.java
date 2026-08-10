package com.tripplanner.exception;

/**
 * Thrown when a trip id does not exist. Mapped to HTTP 404 by
 * {@link GlobalExceptionHandler}.
 *
 * <p>Note: a trip that exists but belongs to another user yields
 * {@code AccessDeniedException} (403) instead — see {@code TripService}.</p>
 */
public class TripNotFoundException extends RuntimeException {

    public TripNotFoundException(String message) {
        super(message);
    }
}
