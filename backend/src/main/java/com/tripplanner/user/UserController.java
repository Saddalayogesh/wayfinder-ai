package com.tripplanner.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
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

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
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
