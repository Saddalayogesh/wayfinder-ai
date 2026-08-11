package com.tripplanner.places;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import com.tripplanner.exception.PlaceNotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Place search and details backed by the active {@link PlacesService}
 * provider (OpenStreetMap Nominatim by default, Google Places when
 * {@code places.provider=google} and a key is configured).
 */
@RestController
@RequestMapping("/api/places")
@Tag(name = "Places", description = "Place search and details from the active provider (OSM by default)")
@Validated
@PreAuthorize("isAuthenticated()")
public class PlacesController {

    private final PlacesService placesService;

    public PlacesController(PlacesService placesService) {
        this.placesService = placesService;
    }

    @GetMapping("/search")
    // Empty results are NOT cached: a transient provider outage (or an
    // unknown place) must not poison the cache for 24h and mask recovery.
    @Cacheable(value = "places", key = "#destination", unless = "#result == null || #result.isEmpty()")
    @Operation(summary = "Search places",
            description = "Searches the active places provider for a destination or place name. Returns up to 'limit' results with coordinates. "
                    + "Results are cached for 24h by destination so repeated searches don't re-hit the external provider.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of matching places (possibly empty)"),
            @ApiResponse(responseCode = "400", description = "Missing or invalid query"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT")
    })
    public List<PlaceResult> search(
            @Parameter(description = "Place or destination to search for", example = "Tokyo", required = true)
            @RequestParam @NotBlank(message = "destination is required") @Size(max = 200) String destination,
            @Parameter(description = "Maximum number of results (1-20)", example = "5")
            @RequestParam(defaultValue = "5") @Min(1) @Max(20) int limit) {
        return placesService.searchPlaces(destination, limit);
    }

    @GetMapping("/{placeId}")
    @Operation(summary = "Get place details",
            description = "Fetches a single place by its provider-specific id (e.g. 'osm:way:5013364' from the search results).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Place found",
                    content = @Content(schema = @Schema(implementation = PlaceResult.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "404", description = "Place not found")
    })
    public PlaceResult get(
            @Parameter(description = "Place id from a search result", example = "osm:way:5013364", required = true)
            @PathVariable String placeId) {
        return placesService.getPlace(placeId);
    }

    @GetMapping("/{placeId}/photo")
    // Overrides the class-level isAuthenticated(): the photo bytes are proxied
    // public data and must be loadable by <img> tags without a JWT.
    @PreAuthorize("permitAll()")
    @Operation(summary = "Get place photo",
            description = "Proxies a place's photo (when the provider has one) through the backend so provider API keys never reach the browser. Returns 404 when the provider has no photo.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Photo bytes",
                    content = @Content(mediaType = "image/*")),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "404", description = "Place has no photo")
    })
    public ResponseEntity<byte[]> photo(
            @Parameter(description = "Place id from a search result", example = "osm:way:5013364", required = true)
            @PathVariable String placeId,
            @Parameter(description = "Maximum photo width in pixels (50-1600)", example = "400")
            @RequestParam(defaultValue = "400") @Min(50) @Max(1600) int maxWidthPx) {
        return placesService.getPhoto(placeId, maxWidthPx)
                .map(photo -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(photo.contentType()))
                        .body(photo.data()))
                .orElseThrow(() -> new PlaceNotFoundException("No photo available for place: " + placeId));
    }
}
