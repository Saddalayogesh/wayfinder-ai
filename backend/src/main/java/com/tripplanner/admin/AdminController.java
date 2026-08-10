package com.tripplanner.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * ADMIN-only operational endpoints. Access is enforced by
 * {@code @PreAuthorize("hasRole('ADMIN')")} — the JWT filter maps the user's
 * {@code role} claim to a {@code ROLE_ADMIN}/{@code ROLE_USER} authority.
 */
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Operational endpoints — ADMIN role required")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @DeleteMapping("/cache/places")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @CacheEvict(value = "places", allEntries = true)
    @Operation(summary = "Evict the places cache",
            description = "Clears all cached place-search results so the next search re-queries the external provider. "
                    + "ADMIN only — a USER token receives 403.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Places cache evicted"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT"),
            @ApiResponse(responseCode = "403", description = "Not an ADMIN")
    })
    public void evictPlacesCache() {
        // Eviction happens declaratively via @CacheEvict(allEntries = true).
    }
}
