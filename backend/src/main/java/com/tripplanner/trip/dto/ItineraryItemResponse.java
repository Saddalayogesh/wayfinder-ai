package com.tripplanner.trip.dto;

import com.tripplanner.trip.ItineraryItem;

import java.math.BigDecimal;

public record ItineraryItemResponse(
        Long id,
        String placeName,
        String description,
        BigDecimal latitude,
        BigDecimal longitude,
        BigDecimal estimatedCost,
        Integer visitDuration,
        Integer sequenceOrder
) {
    public static ItineraryItemResponse from(ItineraryItem item) {
        return new ItineraryItemResponse(
                item.getId(), item.getPlaceName(), item.getDescription(),
                item.getLatitude(), item.getLongitude(), item.getEstimatedCost(),
                item.getVisitDuration(), item.getSequenceOrder());
    }
}
