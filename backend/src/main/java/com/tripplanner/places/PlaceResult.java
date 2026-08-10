package com.tripplanner.places;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

/**
 * A place returned by a PlacesService provider. Fields the provider cannot
 * supply (rating, photo) are null.
 */
@Schema(description = "A place found by the active places provider")
public record PlaceResult(
        @Schema(example = "osm:way:5013364") String id,
        @Schema(example = "Tour Eiffel") String name,
        @Schema(example = "48.8582599") BigDecimal latitude,
        @Schema(example = "2.2945006") BigDecimal longitude,
        @Schema(example = "5 Avenue Anatole France, Paris, 75007, France") String address,
        @Schema(example = "4.7", nullable = true) BigDecimal rating,
        @Schema(nullable = true) String photoUrl
) {
}
