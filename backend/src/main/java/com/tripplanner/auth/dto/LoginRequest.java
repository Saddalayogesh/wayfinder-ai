package com.tripplanner.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Payload for signing in to an existing account")
public record LoginRequest(
        @Schema(example = "jane@example.com")
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid address")
        String email,

        @Schema(example = "password123")
        @NotBlank(message = "Password is required")
        String password
) {
}
