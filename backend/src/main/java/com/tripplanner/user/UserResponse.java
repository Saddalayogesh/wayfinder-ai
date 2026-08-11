package com.tripplanner.user;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * User information safe to expose via the API (never includes the password).
 */
@Schema(description = "Public user information (never includes the password)")
public record UserResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "Jane Doe") String name,
        @Schema(example = "jane@example.com") String email,
        @Schema(example = "USER") Role role,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(),
                user.getRole(), user.getCreatedAt(), user.getUpdatedAt());
    }
}
