package com.tripplanner.user;

import com.tripplanner.auth.AuthService;
import com.tripplanner.user.dto.UpdateProfileRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * User endpoints. These are the reference implementation for role-based
 * authorization: future endpoints should copy the {@code @PreAuthorize}
 * patterns below to restrict access to USER and/or ADMIN roles.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Protected user endpoints (JWT required)")
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    public UserController(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Get the signed-in user",
            description = "Returns the profile of the user identified by the Bearer JWT.")
    public UserResponse me(Authentication authentication) {
        // The JwtAuthenticationFilter stores the User entity as the principal.
        User user = (User) authentication.getPrincipal();
        return UserResponse.from(user);
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Update my profile",
            description = "Updates the signed-in user's name, and optionally the password (both currentPassword and newPassword are required to change it). Returns the refreshed profile.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile updated", content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed or current password is incorrect"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT")
    })
    public UserResponse updateMe(@Valid @RequestBody UpdateProfileRequest request,
                                 Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return authService.updateProfile(user.getId(), request);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all users (ADMIN only)",
            description = "Scaffold endpoint demonstrating ADMIN-only access. Returns 403 for USER tokens.")
    public List<UserResponse> listAll() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }
}
