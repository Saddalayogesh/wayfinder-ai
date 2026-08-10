package com.tripplanner.trip.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for regenerating a single day of a trip with Gemini.
 */
@Schema(description = "Instruction for re-planning one day of the trip")
public record RegenerateDayRequest(
        @Schema(example = "Focus on food and skip crowded tourist spots",
                description = "Free-text instruction for the AI on how to re-plan the day")
        @NotBlank(message = "instruction is required")
        @Size(max = 500, message = "instruction must be at most 500 characters")
        String instruction
) {
}
