package com.tripplanner.favorite.dto;

import com.tripplanner.favorite.Favorite;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "A saved favorite place")
public record FavoriteResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "osm:way:5013364") String placeId,
        @Schema(example = "Tour Eiffel") String placeName,
        Instant createdAt
) {
    public static FavoriteResponse from(Favorite favorite) {
        return new FavoriteResponse(favorite.getId(), favorite.getPlaceId(),
                favorite.getPlaceName(), favorite.getCreatedAt());
    }
}
