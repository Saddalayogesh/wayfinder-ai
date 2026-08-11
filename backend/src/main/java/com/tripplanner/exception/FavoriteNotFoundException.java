package com.tripplanner.exception;

/** Raised when a favorite id does not exist (HTTP 404). */
public class FavoriteNotFoundException extends RuntimeException {

    public FavoriteNotFoundException(String message) {
        super(message);
    }
}
