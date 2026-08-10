package com.tripplanner.favorite;

import com.tripplanner.favorite.dto.FavoriteRequest;
import com.tripplanner.favorite.dto.FavoriteResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Saved-favorite places. All routes need a JWT; favorites are always scoped
 * to the signed-in user (403 for other users' favorites).
 */
@RestController
@RequestMapping("/api/favorites")
@Tag(name = "Favorites", description = "Saved places — every route needs a JWT; favorites are user-scoped")
@PreAuthorize("isAuthenticated()")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Save a place to favorites",
            description = "Saves a place for the signed-in user. Idempotent: saving an already-favorited place returns the existing favorite.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Place saved (or already saved)", content = @Content(schema = @Schema(implementation = FavoriteResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT")
    })
    public FavoriteResponse add(@Valid @RequestBody FavoriteRequest request, Authentication authentication) {
        return favoriteService.addFavorite(currentUserId(authentication), request);
    }

    @GetMapping
    @Operation(summary = "List my favorites",
            description = "Returns the signed-in user's saved places, newest first.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of the user's favorites"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT")
    })
    public List<FavoriteResponse> list(Authentication authentication) {
        return favoriteService.listFavorites(currentUserId(authentication));
    }

    @DeleteMapping("/{favoriteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove a favorite",
            description = "Removes one of the signed-in user's saved places. 403 if it belongs to another user.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Favorite removed"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Favorite belongs to another user"),
            @ApiResponse(responseCode = "404", description = "Favorite not found")
    })
    public void remove(
            @Parameter(description = "Favorite id", example = "1", required = true)
            @PathVariable Long favoriteId,
            Authentication authentication) {
        favoriteService.removeFavorite(currentUserId(authentication), favoriteId);
    }

    private Long currentUserId(Authentication authentication) {
        // The JwtAuthenticationFilter stores the User entity as the principal.
        return ((User) authentication.getPrincipal()).getId();
    }
}
