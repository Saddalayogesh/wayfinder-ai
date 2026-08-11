package com.tripplanner.trip.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

@Schema(description = "A single day within a trip itinerary")
public record TripDayRequest(
        @Schema(example = "1", description = "Day number; auto-assigned when omitted")
        @Min(value = 1, message = "dayNumber must be at least 1")
        Integer dayNumber,

        @Schema(example = "2026-08-15")
        @NotNull(message = "Day date is required")
        LocalDate date,

        @Valid
        @Schema(description = "Places/activities for this day")
        List<@NotNull(message = "Item entries must not be null") ItineraryItemRequest> items
) {
}
