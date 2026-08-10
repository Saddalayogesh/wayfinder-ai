package com.tripplanner.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Profile update: change the display name and optionally the password.
 * The password is only changed when BOTH {@code currentPassword} and
 * {@code newPassword} are supplied (validated by the assertTrue guards).
 */
@Schema(description = "Profile update — change name and optionally the password")
public record UpdateProfileRequest(
        @Schema(example = "Alex Johnson")
        @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must be at most 100 characters")
        String name,

        @Schema(nullable = true, description = "Current password — required only when changing the password")
        @Size(min = 8, max = 100, message = "currentPassword must be at least 8 characters")
        String currentPassword,

        @Schema(nullable = true, description = "New password — required only when changing the password")
        @Size(min = 8, max = 100, message = "newPassword must be at least 8 characters")
        String newPassword
) {
    /** Both password fields must be supplied together. */
    @AssertTrue(message = "currentPassword is required when changing the password")
    public boolean isPasswordFieldsConsistent() {
        return (currentPassword == null && newPassword == null)
                || (currentPassword != null && newPassword != null);
    }

    /** When changing the password, the new one must differ from the current one. */
    @AssertTrue(message = "newPassword must differ from currentPassword")
    public boolean isNewPasswordDifferent() {
        return currentPassword == null || newPassword == null
                || !currentPassword.equals(newPassword);
    }
}
