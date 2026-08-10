package com.tripplanner.trip.dto;

import com.tripplanner.trip.TripDay;

import java.time.LocalDate;
import java.util.List;

public record TripDayResponse(
        Long id,
        Integer dayNumber,
        LocalDate date,
        List<ItineraryItemResponse> items
) {
    public static TripDayResponse from(TripDay day) {
        return new TripDayResponse(
                day.getId(), day.getDayNumber(), day.getDate(),
                day.getItems().stream().map(ItineraryItemResponse::from).toList());
    }
}
