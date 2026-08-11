package com.tripplanner.trip.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Payload for POST /api/trips/generate — the parameters handed to Gemini.
 */
@Schema(description = "Trip parameters used to generate an AI itinerary")
public record GenerateTripRequest(
        @Schema(example = "Tokyo")
        @NotBlank(message = "Destination is required")
        @Size(max = 200, message = "Destination must be at most 200 characters")
        String destination,

        @Schema(example = "2026-08-15")
        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @Schema(example = "2026-08-22")
        @NotNull(message = "End date is required")
        LocalDate endDate,

        @Schema(example = "2")
        @NotNull(message = "Travelers is required")
        @Min(value = 1, message = "Travelers must be at least 1")
        Integer travelers,

        @Schema(example = "3500.00")
        @NotNull(message = "Budget is required")
        @Positive(message = "Budget must be greater than zero")
        @DecimalMin(value = "0.01", message = "Budget must be greater than zero")
        BigDecimal budget,

        @Schema(example = "ADVENTURE")
        @NotBlank(message = "Travel style is required")
        @Size(max = 50, message = "Travel style must be at most 50 characters")
        String travelStyle,

        @Schema(example = "[\"Food\",\"Culture\"]")
        @Size(max = 20, message = "At most 20 interests are allowed")
        List<@Size(max = 50, message = "Each interest must be at most 50 characters") String> interests,

        @Schema(example = "USD", description = "Optional ISO-4217 currency code for costs and the budget; defaults to USD")
        @Size(max = 10, message = "Currency must be at most 10 characters")
        @Pattern(regexp = "^[A-Za-z]{3}$", message = "Currency must be a 3-letter ISO-4217 code")
        String currency
) {
    /** Convenience constructor for callers that don't set a currency (defaults to USD). */
    public GenerateTripRequest(String destination, LocalDate startDate, LocalDate endDate,
                               Integer travelers, BigDecimal budget, String travelStyle,
                               List<String> interests) {
        this(destination, startDate, endDate, travelers, budget, travelStyle, interests, null);
    }

    @AssertTrue(message = "endDate must be on or after startDate")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !startDate.isAfter(endDate);
    }
}
