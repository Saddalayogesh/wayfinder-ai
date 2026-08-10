package com.tripplanner.favorite.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for saving a place to favorites.
 */
@Schema(description = "A place to save to favorites")
public record FavoriteRequest(
        @Schema(example = "osm:way:5013364", description = "Provider-specific place id from a places search")
        @NotBlank(message = "placeId is required")
        @Size(max = 255, message = "placeId must be at most 255 characters")
        String placeId,

        @Schema(example = "Tour Eiffel")
        @NotBlank(message = "placeName is required")
        @Size(max = 200, message = "placeName must be at most 200 characters")
        String placeName
) {
}
