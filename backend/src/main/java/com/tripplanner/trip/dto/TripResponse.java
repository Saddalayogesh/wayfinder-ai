package com.tripplanner.trip.dto;

import com.tripplanner.trip.Trip;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Schema(description = "A trip with its full itinerary (days and items) and budget summary")
public record TripResponse(
        Long id,
        String title,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        Integer travelers,
        BigDecimal budget,
        String travelStyle,
        Set<String> interests,
        List<TripDayResponse> days,
        CostBreakdown cost,
        Instant createdAt,
        Instant updatedAt
) {
    public static TripResponse from(Trip trip) {
        return new TripResponse(
                trip.getId(), trip.getTitle(), trip.getDestination(),
                trip.getStartDate(), trip.getEndDate(), trip.getTravelers(), trip.getBudget(),
                trip.getTravelStyle(), Set.copyOf(trip.getInterests()),
                trip.getDays().stream().map(TripDayResponse::from).toList(),
                CostBreakdown.from(trip),
                trip.getCreatedAt(), trip.getUpdatedAt());
    }
}
