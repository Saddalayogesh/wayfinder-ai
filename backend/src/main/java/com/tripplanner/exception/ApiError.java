package com.tripplanner.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.http.HttpStatus;

import java.time.Instant;

/**
 * Consistent error envelope returned for every failure: {@code { status, message, timestamp }}.
 */
@Schema(description = "Standard error response body")
public record ApiError(
        @Schema(example = "409") int status,
        @Schema(example = "An account with this email already exists") String message,
        Instant timestamp
) {
    public static ApiError of(HttpStatus status, String message) {
        return new ApiError(status.value(), message, Instant.now());
    }

    public static ApiError of(int status, String message) {
        return new ApiError(status, message, Instant.now());
    }
}
