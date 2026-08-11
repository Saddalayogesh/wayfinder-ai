package com.tripplanner.trip.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response of {@code POST /api/trips/{tripId}/share}: the random access token
 * and the full public URL that anyone can open to view the trip read-only.
 */
@Schema(description = "The share token and the public read-only URL for a trip")
public record ShareResponse(
        @Schema(description = "Random non-guessable token (48 hex chars)", example = "3f9a2c...")
        String token,
        @Schema(description = "Public URL: GET /api/shared/trips/{token}",
                example = "http://localhost:8080/shared/trips/3f9a2c...")
        String shareUrl
) {
}
