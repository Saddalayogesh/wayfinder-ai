package com.tripplanner.auth.dto;

import com.tripplanner.user.UserResponse;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Successful authentication result: JWT plus the signed-in user")
public record AuthResponse(
        @Schema(description = "JWT to send as 'Authorization: Bearer <token>'")
        String token,

        @Schema(example = "Bearer")
        String tokenType,

        UserResponse user
) {
    public static AuthResponse of(String token, UserResponse user) {
        return new AuthResponse(token, "Bearer", user);
    }
}
