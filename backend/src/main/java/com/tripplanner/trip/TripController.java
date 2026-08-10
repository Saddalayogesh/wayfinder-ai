package com.tripplanner.trip;

import com.tripplanner.ai.GeminiService;
import com.tripplanner.ai.dto.GeneratedActivity;
import com.tripplanner.ai.dto.GeneratedItinerary;
import com.tripplanner.common.RateLimiter;
import com.tripplanner.exception.RateLimitExceededException;
import com.tripplanner.export.PdfExportService;
import com.tripplanner.trip.dto.GenerateTripRequest;
import com.tripplanner.trip.dto.ItineraryItemRequest;
import com.tripplanner.trip.dto.RegenerateDayRequest;
import com.tripplanner.trip.dto.TripDayRequest;
import com.tripplanner.trip.dto.TripRequest;
import com.tripplanner.trip.dto.TripResponse;
import com.tripplanner.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
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

import java.nio.charset.StandardCharsets;
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
    private final PdfExportService pdfExportService;

    public TripController(TripService tripService, GeminiService geminiService, RateLimiter rateLimiter,
                          PdfExportService pdfExportService) {
        this.tripService = tripService;
        this.geminiService = geminiService;
        this.rateLimiter = rateLimiter;
        this.pdfExportService = pdfExportService;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Tag(name = "AI", description = "Gemini-powered itinerary generation")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true,
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = GenerateTripRequest.class),
                    examples = @ExampleObject(name = "generate", value = """
                            {
                              "destination": "Kyoto",
                              "startDate": "2026-09-01",
                              "endDate": "2026-09-05",
                              "travelers": 2,
                              "budget": 2500.00,
                              "travelStyle": "CULTURAL",
                              "interests": ["Food", "History", "Photography"]
                            }
                            """)))
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

    @PostMapping("/{tripId}/days/{dayNumber}/regenerate")
    @Tag(name = "AI", description = "Gemini-powered itinerary generation")
    @Operation(summary = "Regenerate one day with Gemini",
            description = "Re-plans a single day of a trip. Sends a free-text instruction plus the trip context "
                    + "(destination, budget, travel style, interests, other days) to Gemini and replaces ONLY "
                    + "that day's items — every other day stays untouched. Shares the per-user rate limit "
                    + "with trip generation; Gemini failures return 502.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true,
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = RegenerateDayRequest.class),
                    examples = @ExampleObject(name = "regenerateDay", value = """
                            {
                              "instruction": "Focus on food and skip crowded tourist spots"
                            }
                            """)))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Day regenerated; the full updated trip is returned",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = TripResponse.class),
                            examples = @ExampleObject(name = "updatedTrip", value = """
                                    {
                                      "id": 7,
                                      "title": "AI itinerary for Kyoto",
                                      "destination": "Kyoto",
                                      "days": [
                                        {
                                          "id": 21,
                                          "dayNumber": 2,
                                          "date": "2026-09-02",
                                          "items": [
                                            {
                                              "id": 52,
                                              "placeName": "Nishiki Market food tour",
                                              "description": null,
                                              "latitude": 35.0046,
                                              "longitude": 135.7644,
                                              "estimatedCost": 40,
                                              "visitDuration": 120,
                                              "sequenceOrder": 1
                                            }
                                          ]
                                        }
                                      ],
                                      "cost": {
                                        "estimatedTotal": 1380,
                                        "remaining": 1120,
                                        "breakdown": {
                                          "accommodation": 0,
                                          "food": 620,
                                          "activities": 510,
                                          "transport": 250
                                        }
                                      }
                                    }
                                    """))),
            @ApiResponse(responseCode = "400", description = "Validation failed (blank or too long instruction)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip or day not found"),
            @ApiResponse(responseCode = "429", description = "Rate limit exceeded"),
            @ApiResponse(responseCode = "502", description = "Gemini failed, timed out, or returned an unusable response")
    })
    public TripResponse regenerateDay(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            @Parameter(description = "Day number to regenerate (1-based)", example = "2", required = true)
            @PathVariable int dayNumber,
            @Valid @RequestBody RegenerateDayRequest request,
            Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (!rateLimiter.tryAcquire(userId)) {
            throw new RateLimitExceededException(
                    "AI generation limit reached. Please try again in a few minutes.");
        }
        // Context (with ownership check) is read before the AI call so the slow
        // Gemini request never runs inside a DB transaction.
        RegenerateContext context = tripService.getRegenerateContext(userId, tripId, dayNumber);
        List<GeneratedActivity> activities = geminiService.regenerateDay(
                context.destination(), dayNumber, context.itinerarySummary(), context.budget(),
                context.travelStyle(), List.copyOf(context.interests()), request.instruction());
        return tripService.replaceDayItems(userId, tripId, dayNumber, activities);
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

    @GetMapping("/{tripId}/export/pdf")
    @Operation(summary = "Export a trip as a PDF",
            description = "Streams a printable PDF (OpenPDF) with the destination, dates, day-by-day "
                    + "itinerary, and estimated budget. 403 if the trip belongs to another user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "PDF file (attachment)",
                    content = @Content(mediaType = "application/pdf")),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip not found")
    })
    public void exportPdf(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            Authentication authentication,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        TripResponse trip = tripService.getTripForUser(currentUserId(authentication), tripId);
        byte[] pdf = pdfExportService.renderTripPdf(trip);
        response.setStatus(HttpStatus.OK.value());
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", ContentDisposition.attachment()
                .filename("trip-" + tripId + ".pdf", StandardCharsets.UTF_8)
                .build().toString());
        response.setContentLength(pdf.length);
        response.getOutputStream().write(pdf);
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
