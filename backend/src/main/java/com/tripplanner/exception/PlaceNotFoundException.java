package com.tripplanner.exception;

/**
 * Thrown when a place id cannot be resolved by the active places provider.
 * Mapped to HTTP 404 by {@link GlobalExceptionHandler}.
 */
public class PlaceNotFoundException extends RuntimeException {

    public PlaceNotFoundException(String message) {
        super(message);
    }
}
