package com.tripplanner.exception;

/**
 * Thrown when AI itinerary generation fails (missing API key, Gemini API
 * error, timeout, refusal, or an unparseable/empty response). Mapped to
 * HTTP 502 Bad Gateway by {@link GlobalExceptionHandler}.
 */
public class ItineraryGenerationException extends RuntimeException {

    public ItineraryGenerationException(String message) {
        super(message);
    }
}
