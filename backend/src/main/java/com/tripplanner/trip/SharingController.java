package com.tripplanner.trip;

import com.tripplanner.trip.dto.ShareResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * Trip sharing. Two very different contracts live here:
 *
 * <ul>
 *   <li>{@code POST /api/trips/{tripId}/share} — owner-only (JWT + ownership
 *       check); generates a random, non-guessable token.</li>
 *   <li>{@code GET /api/shared/trips/{token}} — <b>public</b>, no JWT; returns
 *       a read-only trip view. There is deliberately no edit/delete surface on
 *       this route.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Sharing", description = "Share trips with a public read-only link")
public class SharingController {

    private final TripService tripService;

    public SharingController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping("/trips/{tripId}/share")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Share a trip",
            description = "Generates (or returns the existing) random share token for a trip. "
                    + "Only the owner can share; the token grants read-only access to anyone "
                    + "who opens the returned URL.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Share token created/returned",
                    content = @Content(schema = @Schema(implementation = ShareResponse.class),
                            examples = @ExampleObject(name = "share", value = """
                                    {
                                      "token": "9f2e8a1c4b6d7e0f3a5c8b2d4e6f0a1c3b5d7e9f0a2c4b6d8e0f1a3c5b7d9f",
                                      "shareUrl": "http://localhost:8080/shared/trips/9f2e8a1c4b6d7e0f3a5c8b2d4e6f0a1c3b5d7e9f0a2c4b6d8e0f1a3c5b7d9f"
                                    }
                                    """))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Trip belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Trip not found")
    })
    public ShareResponse share(
            @Parameter(description = "Trip id", example = "1", required = true)
            @PathVariable Long tripId,
            Authentication authentication) {
        String token = tripService.createShareToken(currentUserId(authentication), tripId);
        String shareUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/shared/trips/{token}")
                .buildAndExpand(token)
                .toUriString();
        return new ShareResponse(token, shareUrl);
    }

    @GetMapping("/shared/trips/{token}")
    @Operation(summary = "View a shared trip (public)",
            description = "Read-only trip view accessible to anyone with the token — no JWT needed. "
                    + "Contains the full itinerary and budget summary but no edit or delete actions.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Shared trip found",
                    content = @Content(schema = @Schema(implementation = TripResponse.class))),
            @ApiResponse(responseCode = "404", description = "Unknown or revoked token",
                    content = @Content(mediaType = "application/json"))
    })
    public TripResponse getSharedTrip(
            @Parameter(description = "Random share token", example = "9f2e8a1c...", required = true)
            @PathVariable String token) {
        return tripService.getSharedTrip(token);
    }

    private Long currentUserId(Authentication authentication) {
        // The JwtAuthenticationFilter stores the User entity as the principal.
        return ((User) authentication.getPrincipal()).getId();
    }
}
