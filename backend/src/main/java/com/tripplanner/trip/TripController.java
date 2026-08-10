package com.tripplanner.trip;

import com.tripplanner.ai.GeminiService;
import com.tripplanner.ai.dto.GeneratedItinerary;
import com.tripplanner.common.RateLimiter;
import com.tripplanner.exception.RateLimitExceededException;
import com.tripplanner.trip.dto.GenerateTripRequest;
import com.tripplanner.trip.dto.ItineraryItemRequest;
import com.tripplanner.trip.dto.TripDayRequest;
import com.tripplanner.trip.dto.TripRequest;
import com.tripplanner.trip.dto.TripResponse;
import com.tripplanner.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Trip CRUD endpoints. All routes require a valid JWT (enforced by the
 * security chain) and every id-based route rejects trips owned by another
 * user with 403.
 */
@RestController
@RequestMapping("/api/trips")
@Tag(name = "Trips", description = "Trip management — every route needs a JWT; 403 for trips of other users")
@PreAuthorize("isAuthenticated()")
public class TripController {

    private final TripService tripService;
    private final GeminiService geminiService;
    private final RateLimiter rateLimiter;

    public TripController(TripService tripService, GeminiService geminiService, RateLimiter rateLimiter) {
        this.tripService = tripService;
        this.geminiService = geminiService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Generate an AI itinerary with Gemini",
            description = "Sends the trip parameters to Gemini and persists the returned trip with its days and items. "
                    + "Per-user rate limited; Gemini failures return 502.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Itinerary generated and trip persisted",
                    content = @Content(schema = @Schema(implementation = TripResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "429", description = "Rate limit exceeded"),
            @ApiResponse(responseCode = "502", description = "Gemini failed, timed out, or returned an unusable response")
    })
    public TripResponse generate(@Valid @RequestBody GenerateTripRequest request,
                                 Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (!rateLimiter.tryAcquire(userId)) {
            throw new RateLimitExceededException(
                    "AI generation limit reached. Please try again in a few minutes.");
        }
        GeneratedItinerary itinerary = geminiService.generateItinerary(request);
        return tripService.persistGeneratedItinerary(userId, request, itinerary);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a trip",
            description = "Creates a trip for the signed-in user. Optional nested 'days' (with 'items') build the itinerary in the same call.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Trip created",
                    content = @Content(schema = @Schema(implementation = TripResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed (e.g. endDate before startDate, budget <= 0)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT")
    })
    public TripResponse create(@Valid @RequestBody TripRequest request, Authentication authentication) {
        return tripService.createTrip(currentUserId(authentication), request);
    }

    @GetMapping
    @Operation(summary = "List my trips",
            description = "Returns only the signed-in user's trips (newest first), each with its full itinerary.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of the user's trips"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT")
    })
    public List<TripResponse> list(Authentication authentication) {
        return tripService.getAllForUser(currentUserId(authentication));
    }

    @GetMapping("/{tripId}")
    @Operation(summary = "Get one trip", description = "Returns the trip with its days and items. 403 if it belongs to another user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trip found"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip not found")
    })
    public TripResponse get(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            Authentication authentication) {
        return tripService.getTripForUser(currentUserId(authentication), tripId);
    }

    @PutMapping("/{tripId}")
    @Operation(summary = "Update a trip",
            description = "Updates trip fields. If 'days' is present it replaces the itinerary; if omitted, existing days are kept. 403 if the trip belongs to another user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trip updated",
                    content = @Content(schema = @Schema(implementation = TripResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip not found")
    })
    public TripResponse update(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            @Valid @RequestBody TripRequest request,
            Authentication authentication) {
        return tripService.updateTrip(currentUserId(authentication), tripId, request);
    }

    @DeleteMapping("/{tripId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a trip",
            description = "Deletes the trip together with its days and items (cascade). 403 if the trip belongs to another user.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Trip deleted"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip not found")
    })
    public void delete(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            Authentication authentication) {
        tripService.deleteTrip(currentUserId(authentication), tripId);
    }

    // --- Itinerary management -------------------------------------------------

    @PostMapping("/{tripId}/days")
    @Operation(summary = "Add a day to a trip",
            description = "Adds a day (dayNumber auto-assigned when omitted) with optional items. Returns the updated trip.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Day added"),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip not found")
    })
    public TripResponse addDay(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            @Valid @RequestBody TripDayRequest request,
            Authentication authentication) {
        return tripService.addDay(currentUserId(authentication), tripId, request);
    }

    @PostMapping("/{tripId}/days/{dayId}/items")
    @Operation(summary = "Add an item to a day",
            description = "Adds a place/activity to a day (sequenceOrder auto-assigned when omitted). Returns the updated trip.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item added"),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip or day not found")
    })
    public TripResponse addItem(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            @Parameter(description = "Day id", example = "1", required = true)
            @PathVariable Long dayId,
            @Valid @RequestBody ItineraryItemRequest request,
            Authentication authentication) {
        return tripService.addItem(currentUserId(authentication), tripId, dayId, request);
    }

    @DeleteMapping("/{tripId}/days/{dayId}")
    @Operation(summary = "Delete a day", description = "Removes a day and its items. Returns the updated trip.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Day deleted"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip or day not found")
    })
    public TripResponse deleteDay(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            @Parameter(description = "Day id", example = "1", required = true)
            @PathVariable Long dayId,
            Authentication authentication) {
        return tripService.deleteDay(currentUserId(authentication), tripId, dayId);
    }

    @DeleteMapping("/{tripId}/days/{dayId}/items/{itemId}")
    @Operation(summary = "Delete an item", description = "Removes a single place/activity from a day. Returns the updated trip.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item deleted"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip, day or item not found")
    })
    public TripResponse deleteItem(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            @Parameter(description = "Day id", example = "1", required = true)
            @PathVariable Long dayId,
            @Parameter(description = "Item id", example = "1", required = true)
            @PathVariable Long itemId,
            Authentication authentication) {
        return tripService.deleteItem(currentUserId(authentication), tripId, dayId, itemId);
    }

    private Long currentUserId(Authentication authentication) {
        // The JwtAuthenticationFilter stores the User entity as the principal.
        return ((User) authentication.getPrincipal()).getId();
    }
}
