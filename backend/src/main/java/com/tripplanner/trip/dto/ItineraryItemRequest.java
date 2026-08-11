package com.tripplanner.trip.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "A planned place or activity within a trip day")
public record ItineraryItemRequest(
        @Schema(example = "Senso-ji Temple")
        @NotBlank(message = "placeName is required")
        @Size(max = 200, message = "placeName must be at most 200 characters")
        String placeName,

        @Schema(example = "Historic temple in Asakusa")
        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @Schema(example = "35.7148")
        @DecimalMin(value = "-90", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90", message = "Latitude must be between -90 and 90")
        BigDecimal latitude,

        @Schema(example = "139.7967")
        @DecimalMin(value = "-180", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180", message = "Longitude must be between -180 and 180")
        BigDecimal longitude,

        @Schema(example = "10.50", description = "Estimated cost in the trip's currency")
        @DecimalMin(value = "0", message = "estimatedCost must not be negative")
        BigDecimal estimatedCost,

        @Schema(example = "120", description = "Approximate visit time in minutes")
        @Min(value = 0, message = "visitDuration must not be negative")
        Integer visitDuration,

        @Schema(example = "1", description = "Display order; auto-assigned when omitted")
        @Min(value = 1, message = "sequenceOrder must be at least 1")
        Integer sequenceOrder
) {
}
